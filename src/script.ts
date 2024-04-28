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
const historyBar = document.getElementById("history");

const globalState: GlobalState & Story = {
  currentState: {
    inputText: "",
    historyIndex: 0,
  },
  story: [],
  clearStory() {
    this.story = [];
  },
};

function getState(): SavedState | null {
  const savedStateString = localStorage.getItem("smartCodeState");
  if (savedStateString) {
    return JSON.parse(savedStateString);
  }
  return null;
}

function setState(newState: SavedState): void {
  localStorage.setItem("smartCodeState", JSON.stringify(newState));
  globalState.currentState = newState;
}

function initializeState(): void {
  globalState.currentState = getState() ?? globalState.currentState;

  inputField.value = globalState.currentState.inputText;

  vscode.postMessage({ command: "history" });
}

function setHistory(conversation: Conversation) {
  globalState.clearStory();
  formatOutput(conversation.messages, globalState.story);
}

function sendMessage(): void {
  const conversationIndex = globalState.currentState.historyIndex;
  vscode.postMessage({
    command: "ask",
    text: inputField.value,
    index: conversationIndex,
  });
  inputField.value = "";
  console.log(globalState.currentState.historyIndex);
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
  const currentState = globalState.currentState;
  const data: Message = event.data;
  console.log(event.origin);
  if (textP1 && spinner) {
    switch (data.sender) {
      case "history": {
        // Define a default empty conversation
        let showedConversation: Conversation = { messages: [] };

        // Retrieve conversations from data
        const conversations = data.content as Conversation[];
        if (
          currentState?.historyIndex !== undefined &&
          currentState?.historyIndex !== null
        ) {
          showedConversation = conversations[currentState.historyIndex];
          createHistoryButtons(conversations);
        }

        formatOutput(showedConversation.messages, globalState.story);
        break;
      }

      case "stream": {
        textP1.textContent = data.content as string; // The JSON data our extension sent;
        break;
      }
      case "complete": {
        //history: [{ role: string; content: string; }]
        const history = data.content as Conversation["messages"];
        history.shift();
        formatOutput(history, globalState.story);
        break;
      }
      case "spinner": {
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
function formatOutput(history: Conversation["messages"], story: string[]) {
  for (const message of history) {
    if (message.role === "user") {
      story.unshift(`${message.content}`);
    } else {
      story.unshift(message.content);
    }
    updateTextP2(story);
  }
  console.log(history);
}

function createHistoryButtons(conversations: Conversation[]): void {
  const currentState = globalState.currentState;
  conversations.forEach((conversation, index) => {
    const firstQuestion = conversation.messages[0];
    const button = document.createElement("button");
    button.classList.add("historyButton");
    button.id = String(index);
    button.textContent = firstQuestion.content;
    button.addEventListener("click", () => {
      currentState.historyIndex = Number(button.id);
      setState(currentState);
      setHistory(conversation);
    });
    historyBar?.appendChild(button);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeState();
});

document.getElementById("uInput")?.addEventListener("change", () => {
  const inputText = inputField.value;
  const currentState = globalState.currentState;
  currentState.inputText = inputText;
  setState(currentState);
});
