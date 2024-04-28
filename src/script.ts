interface Vscode {
  postMessage(message: object): void;
}
declare const marked: JSON;
declare const vscode: Vscode;
const div = document.getElementsByClassName("chat-container");
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearButton");
const inputField = document.getElementById("uInput") as HTMLInputElement;
const copyButton = document.getElementById("copyButton");
const textP1 = document.getElementById("p1");
const textP2 = document.getElementById("p2");
const spinner = document.getElementById("loadingSpinner");

function getState(): JSON | string {
  return JSON.parse(localStorage.getItem("smartCodeState") ?? "");
}

function setState(newState: string): void {
  localStorage.setItem("smartCodeState", JSON.stringify(newState));
}

function initializeState(): void {
  const currentState = getState();
  inputField.value = currentState as string;
  vscode.postMessage({ command: "history" });
}

function sendMessage(): void {
  vscode.postMessage({ command: "alert", text: inputField.value });
  inputField.value = "";
}

function clearHistory(): void {
  vscode.postMessage({ command: "clear" });
  if (textP1) { textP1.textContent = ''; };
  if (textP2) { textP2.textContent = ''; };
}

sendButton?.addEventListener("click", () => {
  sendMessage();
});

clearButton?.addEventListener("click", () => {
  clearHistory();
});

copyButton?.addEventListener("click", () =>
  setClipboard(textP1?.textContent ?? "")
);

async function setClipboard(text: string): Promise<void> {
  const type = "text/plain";
  const blob = new Blob([text], { type });
  const data: ClipboardItem[] = [new ClipboardItem({ [type]: blob })];
  await navigator.clipboard.write(data);
}

document?.addEventListener("keypress", (event) => {
  if (event.key === "Enter" && event.shiftKey !== true) {
    event.preventDefault();
    sendMessage();
  } else if (event.key === "Enter" && event.shiftKey === true) {
    const inputText = inputField.value;

    inputText.concat("\n");
  }
});
// Pieni securty risk pitää korjaa Soon™
// Handle the message inside the webview
window?.addEventListener("message", (event) => {
  const data: Message = event.data;

  switch (data.sender) {
    case "history": {
      const conversations = data.content as Conversation[];
      const lastConversation = conversations[conversations.length - 1];
      for (const conversation of conversations) {
        console.table(conversation);
      }
      formatOutput(lastConversation.messages);
      break;
    }
    case "stream": {
      if (textP1) {
        textP1.textContent = data.content as string; // The JSON data our extension sent;
      }
      break;
    }
    case "complete": {
      const history = data.content as Conversation["messages"];
      console.log(history);
      if (textP1) { textP1.textContent = ''; }
      history.shift();
      formatOutput(history);

      break;
    }
    case "spinner": {
      if (textP1 && spinner) {
        if (data.content === "hideSpinner") {
          spinner.style.display = "none";
        } else {
          spinner.style.display = "block";
        }
      }
    }
  }
});
async function updateTextP2(story: string[]) {
  const markedContent = await marked.parse(
    story.map((code) => `${code}`).join('\n')
  );
  if (textP2) {
    console.log('daContent', markedContent);
    textP2.innerHTML = markedContent;

  }
}
function formatOutput(history: Conversation["messages"]) {
  const story: string[] = [];
  for (const message of history) {
    if (message.role === "user") {
      story.unshift(`${message.content}`);
    } else {
      story.unshift(message.content);
    }
    updateTextP2(story);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeState();
});

document.getElementById("uInput")?.addEventListener("change", () => {
  const inputText = (document.getElementById("uInput") as HTMLInputElement)
    .value;
  setState(inputText);
});
