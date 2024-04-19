"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const div = document.getElementsByClassName("chat-container");
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearButton");
const inputField = document.getElementById("uInput");
const copyButton = document.getElementById("copyButton");
const textP1 = document.getElementById("p1");
function getState() {
    return JSON.parse(localStorage.getItem("smartCodeState") ?? "");
    return JSON.parse(localStorage.getItem("smartCodeState") ?? "");
}
function setState(newState) {
    localStorage.setItem("smartCodeState", JSON.stringify(newState));
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
    vscode.postMessage({ command: "alert", text: inputField.value });
    inputField.value = "";
}
function clearHistory() {
    vscode.postMessage({ command: "clear" });
    vscode.postMessage({ command: "clear" });
}
sendButton?.addEventListener("click", () => {
    sendMessage();
    sendMessage();
});
clearButton?.addEventListener("click", () => {
    clearHistory();
    clearHistory();
});
copyButton?.addEventListener("click", () => setClipboard(textP1?.textContent ?? ""));
async function setClipboard(text) {
    const type = "text/plain";
    const blob = new Blob([text], { type });
    const data = [new ClipboardItem({ [type]: blob })];
    await navigator.clipboard.write(data);
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
    console.log(event);
    const data = event.data;
    switch (data.sender) {
        case "history": {
            const messages = data.response;
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
                textP1.textContent = data.response; // The JSON data our extension sent;
            }
            break;
    }
});
document.addEventListener("DOMContentLoaded", () => {
    initializeState();
    initializeState();
});
document.getElementById("uInput")?.addEventListener("change", () => {
    const inputText = document.getElementById("uInput")
        .value;
    setState(inputText);
    const inputText = document.getElementById("uInput")
        .value;
    setState(inputText);
});
//# sourceMappingURL=script.js.map