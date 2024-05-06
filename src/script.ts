declare const marked: JSON;
declare const vscode: Vscode;
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearChat");
const inputField = document.getElementById("uInput") as HTMLInputElement;
const textP1 = document.getElementById("p1");
const textP2 = document.getElementById("p2");
const spinner = document.getElementById("loader");
const historyBar = document.getElementById("history");
const newButton = document.getElementById("newChat") as HTMLButtonElement;

const globalState: GlobalState & Story = {
  currentState: {
    historyIndex: 0,
    storedConversations: [],
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
  const spinnerState = localStorage.getItem("spinnerState");
  globalState.currentState = getState() || globalState.currentState;
  vscode.postMessage({ command: "history" });
  vscode.postMessage({
    command: "context",
    index: globalState.currentState.historyIndex,
  });
  if (spinner && spinnerState) {
    spinner.style.display = spinnerState;
  }
}

function setHistory(conversation: Conversation) {
  globalState.clearStory();
  formatOutput(conversation.messages);
}

function sendMessage(): void {
  const conversationIndex = globalState.currentState.historyIndex;
  vscode.postMessage({
    command: "ask",
    text: inputField.value,
    index: conversationIndex,
  });
  const active = document.getElementsByClassName(
    "historyButtonActive"
  )[0] as HTMLButtonElement;
  console.log();

  if (active.innerText === "Current") {
    active.innerText = inputField.value;
  }

  inputField.value = "";
}

function clearHistory(): void {
  vscode.postMessage({ command: "delete" });
  if (textP1 && textP2) {
    textP1.textContent = "";
    textP2.textContent = "";
  }
  globalState.clearStory();
  removeExistingButtons();
}

sendButton?.addEventListener("click", () => {
  sendMessage();
});

clearButton?.addEventListener("click", () => {
  clearHistory();
});

newButton?.addEventListener("click", () => {
  if (globalState.story.length === 0) {
    return;
  }
  const currentState = globalState.currentState;
  const defaultButton = document.getElementById("0");

  if (!defaultButton || defaultButton.textContent === "Current") {
    return;
  }

  vscode.postMessage({ command: "newConversation" });

  const createHistoryButton = (id: number) => {
    const button = document.createElement("button");
    button.classList.add("historyButton");
    button.textContent = "Current";
    button.id = String(id);
    button.addEventListener("click", () => {
      currentState.historyIndex = Number(button.id);
      setState(currentState);
      const clickedConversation =
        currentState.storedConversations[Number(button.id)];
      setHistory(clickedConversation);
      setConversationActive();
      vscode.postMessage({ command: "context", index: button.id });
    });
    return button;
  };

  const buttons = document.querySelectorAll<HTMLElement>(
    ".historyButton, .historyButtonActive"
  );

  for (const button of buttons) {
    button.id = String(Number(button.id) + 1);
  }
  insertAfter(createHistoryButton(0), newButton);
  const newConversation: Conversation = {
    messages: [],
  };
  currentState.storedConversations.unshift(newConversation);
  console.log(currentState.storedConversations);
});

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

// Handle the message inside the webview
window?.addEventListener("message", (event) => {
  const currentState = globalState.currentState;
  const data: Message = event.data;
  if (textP1 && spinner) {
    switch (data.sender) {
      case "history": {
        const conversations = data.content as Conversation[];
        const showedConversation =
          conversations[currentState?.historyIndex ?? 0];
        createHistoryButtons(conversations);
        if (showedConversation?.messages) {
          formatOutput(showedConversation.messages);
        }
        break;
      }
      case "stream": {
        if (data.index === globalState.currentState.historyIndex) {
          updateTextP1(data.content as string);
        }
        break;
      }
      case "complete": {
        const history = data.content as Conversation["messages"];

        const conversation =
          currentState.storedConversations[data.index as number];
        conversation.messages.push(...history);

        if (data.index === globalState.currentState.historyIndex) {
          formatOutput(history);
        }
        break;
      }
      case "spinner": {
        if (data.content === "hideSpinner") {
          spinner.style.display = "none";
          newButton.disabled = false;
          localStorage.setItem("spinnerState", "none");
        } else {
          spinner.style.display = "block";
          newButton.disabled = true;
          localStorage.setItem("spinnerState", "block");
        }
        break;
      }
    }
  }
});
function insertAfter(newNode: Node, referenceNode: Node) {
  referenceNode.parentNode?.insertBefore(newNode, referenceNode.nextSibling);
}

async function updateTextP2() {
  const story = globalState.story;
  const markedContent = await marked.parse(
    story.map((code) => `${code}`).join("\n")
  );
  if (textP2) {
    const regex = /<\/pre>/g;
    const out = markedContent.replace(
      regex,
      '</pre> <button class="copy-button">Copy</button>'
    );
    textP2.innerHTML = out;
  }
  if (textP1) {
    textP1.innerHTML = "";
  }
  const buttons = document.querySelectorAll(".copy-button");
  for (const button of buttons) {
    button.addEventListener("click", () => {
      const codeBlock = button.previousElementSibling;
      const codeText = codeBlock?.textContent;
      button.textContent = "Copied";
      setClipboard(codeText ?? "");
    });
  }
}
async function updateTextP1(story: string) {
  const markedContent = await marked.parse(story);
  if (textP1) {
    textP1.innerHTML = markedContent;
  }
}
function formatOutput(history: Conversation["messages"]) {
  const story = globalState.story;
  if (textP2 && history.length === 0) {
    textP2.innerHTML = "";
  }
  for (const message of history) {
    if (message.role === "user") {
      story.unshift(`<div class="user">YOU: ${message.content}</div>`);
    } else {
      story.unshift(`${message.content}`);
    }
    updateTextP2();
  }
}

function setConversationActive() {
  const buttons = document.querySelectorAll<HTMLElement>(
    ".historyButton, .historyButtonActive"
  );
  const index = globalState.currentState.historyIndex as number;
  console.log(`index is ${index}`);
  for (const button of buttons) {
    if (Number(button.id) === index) {
      button.className = "historyButtonActive";
    } else {
      button.className = "historyButton";
    }
  }
}

function createHistoryButtons(conversations: Conversation[]): void {
  const currentState = globalState.currentState;

  if (
    currentState.historyIndex &&
    conversations.length < currentState.historyIndex
  ) {
    currentState.historyIndex = 0;
  }

  currentState.storedConversations = conversations;
  for (const [index, conversation] of conversations.entries()) {
    const firstQuestion = conversation.messages[0];
    const button = document.createElement("button");
    button.classList.add("historyButton");
    button.id = String(index);
    button.textContent = firstQuestion?.content || "Current";

    button.addEventListener("click", () => {
      currentState.historyIndex = Number(button.id);
      setState(currentState);
      const clickedConversation =
        currentState.storedConversations[Number(button.id)];
      setHistory(clickedConversation);
      setConversationActive();
      vscode.postMessage({ command: "context", index: button.id });
    });
    historyBar?.insertBefore(button, historyBar.lastElementChild);
  }

  setConversationActive();
}

function removeExistingButtons() {
  const buttons = document.querySelectorAll<HTMLElement>(
    ".historyButton, .historyButtonActive"
  );
  for (const button of buttons) {
    button.remove();
  }
  globalState.currentState.historyIndex = 0;
}

document.addEventListener("DOMContentLoaded", () => {
  initializeState();
});
