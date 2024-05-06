"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearChat");
const newButton = document.getElementById("newChat");
const inputField = document.getElementById("uInput");
const textP1 = document.getElementById("p1");
const textP2 = document.getElementById("p2");
const spinner = document.getElementById("loader");
const historyBar = document.getElementById("history");
const globalState = {
    currentState: {
        historyIndex: 0,
        storedConversations: [],
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
/**
 * Sets the state based on the saved state in localStorage.
 */
function initializeState() {
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
function setHistory(conversation) {
    globalState.clearStory();
    formatOutput(conversation.messages);
}
/**
 * Handles sending a message based on the input field value.
 */
function sendMessage() {
    const conversationIndex = globalState.currentState.historyIndex;
    vscode.postMessage({
        command: "ask",
        text: inputField.value,
        index: conversationIndex,
    });
    const active = document.getElementsByClassName("historyButtonActive")[0];
    console.log();
    if (active.innerText === "Current") {
        active.innerText = inputField.value;
    }
    inputField.value = "";
}
/**
 * Clears the chat history and resets the state.
 */
function clearHistory() {
    vscode.postMessage({ command: "delete" });
    if (textP1 && textP2) {
        textP1.textContent = "";
        textP2.textContent = "";
    }
    globalState.clearStory();
    const buttons = document.querySelectorAll(".historyButton, .historyButtonActive");
    for (const button of buttons) {
        button.remove();
    }
    globalState.currentState.historyIndex = 0;
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
    const createHistoryButton = (id) => {
        const button = document.createElement("button");
        button.classList.add("historyButton");
        button.textContent = "Current";
        button.id = String(id);
        button.addEventListener("click", handleButtonClick(button));
        return button;
    };
    const buttons = document.querySelectorAll(".historyButton, .historyButtonActive");
    for (const button of buttons) {
        button.id = String(Number(button.id) + 1);
    }
    insertAfter(createHistoryButton(0), newButton);
    const newConversation = {
        messages: [],
    };
    currentState.storedConversations.unshift(newConversation);
    console.log(currentState.storedConversations);
});
/**
 * Handles creating a new conversation button.
 */
function createHistoryButtons(conversations) {
    const currentState = globalState.currentState;
    if (currentState.historyIndex &&
        conversations.length < currentState.historyIndex) {
        currentState.historyIndex = 0;
    }
    currentState.storedConversations = conversations;
    for (const [index, conversation] of conversations.entries()) {
        const firstQuestion = conversation.messages[0];
        const button = document.createElement("button");
        button.classList.add("historyButton");
        button.id = String(index);
        button.textContent = firstQuestion?.content || "Current";
        button.addEventListener("click", handleButtonClick(button));
        historyBar?.insertBefore(button, historyBar.lastElementChild);
    }
    setConversationActive();
}
/**
 * Handles the click event of a history button.
 */
function handleButtonClick(button) {
    return () => {
        const currentState = globalState.currentState;
        currentState.historyIndex = Number(button.id);
        setState(currentState);
        const clickedConversation = currentState.storedConversations[Number(button.id)];
        setHistory(clickedConversation);
        setConversationActive();
        vscode.postMessage({ command: "context", index: button.id });
    };
}
async function setClipboard(text) {
    const type = "text/plain";
    const blob = new Blob([text], { type });
    const data = [new ClipboardItem({ [type]: blob })];
    await navigator.clipboard.write(data);
}
/*
 * Handles keystroke changes.
 */
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
                const conversations = data.content;
                const showedConversation = conversations[currentState?.historyIndex ?? 0];
                createHistoryButtons(conversations);
                if (showedConversation?.messages) {
                    formatOutput(showedConversation.messages);
                }
                break;
            }
            case "stream": {
                if (data.index === globalState.currentState.historyIndex) {
                    updateTextP1(data.content);
                }
                break;
            }
            case "complete": {
                const history = data.content;
                const conversation = currentState.storedConversations[data.index];
                conversation.messages.push(...history);
                if (data.index === globalState.currentState.historyIndex) {
                    formatOutput(history);
                }
                break;
            }
            case "spinner": {
                const displayStyle = data.content === "hideSpinner" ? "none" : "block";
                spinner.style.display = displayStyle;
                newButton.disabled = data.content !== "hideSpinner";
                localStorage.setItem("spinnerState", displayStyle);
                break;
            }
        }
    }
});
function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode?.insertBefore(newNode, referenceNode.nextSibling);
}
/**
 * Handles updating text in textP2 based on the provided story.
 */
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
/**
 * Handles updating text in textP1 based on the provided story.
 */
async function updateTextP1(story) {
    const markedContent = await marked.parse(story);
    if (textP1) {
        textP1.innerHTML = markedContent;
    }
}
/**
 * Formats and updates the output based on the conversation history.
 */
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
/**
 * Sets the active conversation in the UI by applying the active class to the corresponding history button.
 */
function setConversationActive() {
    const buttons = document.querySelectorAll(".historyButton, .historyButtonActive");
    const index = globalState.currentState.historyIndex;
    console.log(`index is ${index}`);
    for (const button of buttons) {
        if (Number(button.id) === index) {
            button.className = "historyButtonActive";
        }
        else {
            button.className = "historyButton";
        }
    }
}
document.addEventListener("DOMContentLoaded", () => {
    initializeState();
});
//# sourceMappingURL=script.js.map