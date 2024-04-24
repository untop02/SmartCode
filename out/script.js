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
const story = [];
function getState() {
    return JSON.parse(localStorage.getItem("smartCodeState") ?? "");
}
function setState(newState) {
    localStorage.setItem("smartCodeState", JSON.stringify(newState));
}
function initializeState() {
    const currentState = getState();
    inputField.value = currentState;
    vscode.postMessage({ command: "history" });
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
                const conversations = data.content;
                const lastConversation = conversations[conversations.length - 1];
                for (const conversation of conversations) {
                    const firstQuestion = conversation.messages[0];
                    console.table(conversation);
                    const button = document.createElement("button");
                    button.setAttribute("id", "sendButton");
                    button.textContent = firstQuestion.content;
                    historyBar?.appendChild(button);
                }
                formatOutput(lastConversation.messages, story);
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
}
document.addEventListener("DOMContentLoaded", () => {
    initializeState();
});
document.getElementById("uInput")?.addEventListener("change", () => {
    const inputText = document.getElementById("uInput")
        .value;
    setState(inputText);
});
//# sourceMappingURL=script.js.map