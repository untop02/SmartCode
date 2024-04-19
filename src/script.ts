interface Vscode {
  postMessage(message: object): void;
}

declare const vscode: Vscode;
const div = document.getElementsByClassName("chat-container");
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearButton");
const inputField = document.getElementById("uInput") as HTMLInputElement;
const copyButton = document.getElementById("copyButton");
const textP1 = document.getElementById("p1");

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
  console.log(event);
  const data: Message = event.data;
  switch (data.sender) {
    case "history": {
      const messages = data.response as Conversation;
      if (messages.messages.length === 0) {
        return;
      }
      if (textP1) {
        textP1.textContent = "";
      }
      for (const message of messages.messages) {
        textP1?.append(`${message}\n`);
      }
      break;
    }
    case "openAi":
      if (textP1) {
        textP1.textContent = data.response as string; // The JSON data our extension sent;
      }
      break;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  initializeState();
});

document.getElementById("uInput")?.addEventListener("change", () => {
  const inputText = (document.getElementById("uInput") as HTMLInputElement)
    .value;
  setState(inputText);
});
