"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearChat");
const inputField = document.getElementById("uInput");
const copyButton = document.getElementById("copyButton");
const textP1 = document.getElementById("p1");
const textP2 = document.getElementById("p2");
const spinner = document.getElementById("loader");
const historyBar = document.getElementById("history");
const newButton = document.getElementById("newChat");
const globalState = {
    currentState: {
        historyIndex: 0,
    },
    story: [],
    clearStory() {
        this.story = [];
    },
};
function getState() {
    const savedStateString = localStorage.getItem("smartCodeState");
    if (savedStateString) {
        return JSON.parse(savedStateString);
    }
    return null;
}
function setState(newState) {
    localStorage.setItem("smartCodeState", JSON.stringify(newState));
    globalState.currentState = newState;
}
function initializeState() {
    globalState.currentState = getState() || globalState.currentState;
    vscode.postMessage({ command: "history" });
}
function setHistory(conversation) {
    globalState.clearStory();
    formatOutput(conversation.messages);
}
function sendMessage() {
    const conversationIndex = globalState.currentState.historyIndex;
    vscode.postMessage({
        command: "ask",
        text: inputField.value,
        index: conversationIndex,
    });
    inputField.value = "";
    console.log(globalState.currentState.historyIndex);
}
function clearHistory() {
    vscode.postMessage({ command: "delete" });
    if (textP1 && textP2) {
        textP1.textContent = "";
        textP2.textContent = "";
    }
    globalState.clearStory();
    const children = Array.prototype.slice.call(historyBar?.children);
    for (const button of children) {
        if (!Number.isNaN(Number(button.id))) {
            button.remove();
        }
    }
}
sendButton?.addEventListener("click", () => {
    sendMessage();
});
clearButton?.addEventListener("click", () => {
    clearHistory();
});
copyButton?.addEventListener("click", () => setClipboard(textP1?.textContent ?? ""));
newButton?.addEventListener("click", () => {
    if (globalState.story.length === 0) {
        return;
    }
    const currentState = globalState.currentState;
    const defaultButton = document.getElementById("0");
    if (!defaultButton || defaultButton.textContent === "Current") {
        return;
    }
    vscode.postMessage({ command: "clear" });
    const createHistoryButton = (id) => {
        const button = document.createElement("button");
        button.classList.add("historyButton");
        button.textContent = "Current";
        button.id = String(id);
        button.addEventListener("click", () => {
            currentState.historyIndex = Number(button.id);
            setState(currentState);
            setHistory({ messages: [] });
            setConversationActive();
        });
        return button;
    };
    const buttons = document.querySelectorAll(".historyButton, .historyButtonActive");
    for (const button of buttons) {
        button.id = String(Number(button.id) + 1);
    }
    insertAfter(createHistoryButton(0), newButton);
});
async function setClipboard(text) {
    const type = "text/plain";
    const blob = new Blob([text], { type });
    const data = [new ClipboardItem({ [type]: blob })];
    await navigator.clipboard.write(data);
}
document?.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && event.shiftKey !== true) {
        event.preventDefault();
        sendMessage();
    }
    else if (event.key === "Enter" && event.shiftKey === true) {
        const inputText = inputField.value;
        inputText.concat("\n");
    }
});
// Handle the message inside the webview
window?.addEventListener("message", (event) => {
    const currentState = globalState.currentState;
    const data = event.data;
    if (textP1 && spinner) {
        switch (data.sender) {
            case "history": {
                // Define a default empty conversation
                let showedConversation = { messages: [] };
                // Retrieve conversations from data
                const conversations = data.content;
                if (currentState?.historyIndex !== undefined &&
                    currentState?.historyIndex !== null) {
                    showedConversation = conversations[currentState.historyIndex];
                    createHistoryButtons(conversations);
                }
                formatOutput(showedConversation.messages);
                break;
            }
            case "stream": {
                updateTextP1(data.content);
                break;
            }
            case "complete": {
                //history: [{ role: string; content: string; }]
                const history = data.content;
                formatOutput(history);
                break;
            }
            case "spinner": {
                if (data.content === "hideSpinner") {
                    spinner.style.display = "none";
                }
                else {
                    spinner.style.display = "block";
                }
            }
        }
    }
});
function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode?.insertBefore(newNode, referenceNode.nextSibling);
}
async function updateTextP2() {
    const story = globalState.story;
    const markedContent = await marked.parse(story.map((code) => `${code}`).join("\n"));
    if (textP2) {
        const regex = /<\/pre>/g;
        const out = markedContent.replace(regex, '</pre> <button class="copy-button">Copy</button>');
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
async function updateTextP1(story) {
    const markedContent = await marked.parse(story);
    if (textP1) {
        textP1.innerHTML = markedContent;
    }
}
function formatOutput(history) {
    const story = globalState.story;
    if (textP2 && history.length === 0) {
        textP2.innerHTML = "";
    }
    for (const message of history) {
        if (message.role === "user") {
            story.unshift(`<div class="user">YOU: ${message.content}</div>`);
        }
        else {
            story.unshift(`${message.content}`);
        }
        updateTextP2();
    }
}
function setConversationActive() {
    const buttons = document.querySelectorAll(".historyButton, .historyButtonActive");
    const index = globalState.currentState.historyIndex;
    for (const button of buttons) {
        if (Number(button.id) === index) {
            button.className = "historyButtonActive";
        }
        else {
            button.className = "historyButton";
        }
    }
}
function createHistoryButtons(conversations) {
    const buttons = document.querySelectorAll(".historyButton, .historyButtonActive");
    for (const button of buttons) {
        button.remove();
    }
    const currentState = globalState.currentState;
    if (currentState.historyIndex &&
        conversations.length < currentState.historyIndex) {
        globalState.currentState.historyIndex = 0;
    }
    conversations.forEach((conversation, index) => {
        const firstQuestion = conversation.messages[0];
        const button = document.createElement("button");
        button.classList.add("historyButton");
        button.id = String(index);
        button.textContent =
            firstQuestion !== undefined ? firstQuestion.content : "Current";
        button.addEventListener("click", () => {
            currentState.historyIndex = Number(button.id);
            setState(currentState);
            setHistory(conversation);
            setConversationActive();
            vscode.postMessage({ command: "context", index: button.id });
            vscode.postMessage({ command: "clear" });
        });
        historyBar?.insertBefore(button, historyBar.lastElementChild);
    });
    setConversationActive();
}
document.addEventListener("DOMContentLoaded", () => {
    initializeState();
});
//# sourceMappingURL=script.js.map