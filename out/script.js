"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const div = document.getElementsByClassName("chat-container");
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearButton");
const inputField = document.getElementById("uInput");
const copyButton = document.getElementById("copyButton");
const textP1 = document.getElementById("p1");
const textP2 = document.getElementById("p2");
const spinner = document.getElementById("loadingSpinner");
const historyBar = document.getElementById("history");
let story = [];
function getState() {
    const savedStateString = localStorage.getItem("smartCodeState");
    if (savedStateString) {
        return JSON.parse(savedStateString);
    }
    return null;
}
function setState(newState) {
    localStorage.setItem("smartCodeState", JSON.stringify(newState));
}
function initializeState() {
    const currentState = getState() ?? {
        inputText: "",
        historyIndex: 0,
    };
    console.log("Current state:", JSON.stringify(currentState));
    inputField.value = currentState.inputText;
    vscode.postMessage({ command: "history" });
}
function setHistory(conversation) {
    story = [];
    formatOutput(conversation.messages, story);
}
function sendMessage() {
    vscode.postMessage({ command: "alert", text: inputField.value });
    inputField.value = "";
}
function clearHistory() {
    vscode.postMessage({ command: "clear" });
}
sendButton?.addEventListener("click", () => {
    sendMessage();
});
clearButton?.addEventListener("click", () => {
    clearHistory();
});
copyButton?.addEventListener("click", () => setClipboard(textP1?.textContent ?? ""));
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
// Pieni securty risk pitää korjaa Soon™
// Handle the message inside the webview
window?.addEventListener("message", (event) => {
    const data = event.data;
    console.log(event.origin);
    if (textP1 && spinner) {
        switch (data.sender) {
            case "history": {
                // Define a default empty conversation
                let showedConversation = { messages: [] };
                const currentState = getState();
                // Retrieve conversations from data
                const conversations = data.content;
                if (currentState?.historyIndex !== undefined &&
                    currentState?.historyIndex !== null) {
                    showedConversation = conversations[currentState.historyIndex];
                    createHistoryButtons(conversations);
                }
                formatOutput(showedConversation.messages, story);
                break;
            }
            case "stream": {
                textP1.textContent = data.content; // The JSON data our extension sent;
                break;
            }
            case "complete": {
                //history: [{ role: string; content: string; }]
                const history = data.content;
                history.shift();
                formatOutput(history, story);
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
async function updateTextP2(story) {
    const markedContent = await marked.parse(story.map((code) => `${code}`).join("<br />"));
    if (textP2) {
        textP2.innerHTML = markedContent;
    }
}
function formatOutput(history, story) {
    for (const message of history) {
        if (message.role === "user") {
            story.unshift(`<b>${message.content}</b>\n\n`);
        }
        else {
            story.unshift(message.content);
        }
        updateTextP2(story);
    }
    console.log(history);
}
function createHistoryButtons(conversations) {
    let index = 0;
    for (const conversation of conversations) {
        const firstQuestion = conversation.messages[0];
        const button = document.createElement("button");
        button.setAttribute("class", "historyButton");
        button.setAttribute("id", String(index));
        button.textContent = firstQuestion.content;
        button.addEventListener("click", () => {
            const state = getState();
            // Update the history index in the state and save it
            if (state !== undefined && state !== null) {
                state.historyIndex = Number(button.id);
                console.log(state);
                setState(state);
            }
            // Update the UI based on the selected conversation
            setHistory(conversation);
        });
        historyBar?.appendChild(button);
        index++;
    }
}
document.addEventListener("DOMContentLoaded", () => {
    initializeState();
});
document.getElementById("uInput")?.addEventListener("change", () => {
    const inputText = inputField.value;
    const state = getState();
    if (state !== undefined && state !== null) {
        console.log(inputText);
        state.inputText = inputText;
        setState(state);
    }
});
//# sourceMappingURL=script.js.map