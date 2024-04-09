"use strict";
const div = document.getElementsByClassName("chat-container");
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearButton");
const inputField = document.getElementById("uInput");
function getState() {
    return JSON.parse(localStorage.getItem("smartCodeState") ?? "");
}
function setState(newState) {
    localStorage.setItem("smartCodeState", JSON.stringify(newState));
}
//Pitää ehkä säätää vielä koska poistaa
function initializeState() {
    const currentState = getState();
    inputField.value = currentState;
}
function sendMessage() {
    vscode.postMessage({ command: "alert", text: inputField.value });
    inputField.value = "";
}
function clearHistory() {
    vscode.postMessage({ command: "clear" });
    inputField.value = "";
}
sendButton?.addEventListener("click", () => {
    sendMessage();
});
clearButton?.addEventListener("click", () => {
    clearHistory();
});
document?.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && event.shiftKey !== true) {
        sendMessage();
    }
    else if (event.key === "Enter" && event.shiftKey === true) {
        const inputText = inputField.value;
        inputText.concat("\n");
    }
});
document.addEventListener("DOMContentLoaded", () => {
    initializeState();
});
document.getElementById("uInput")?.addEventListener("change", () => {
    const inputText = document.getElementById("uInput")
        .value;
    setState(inputText);
});
//# sourceMappingURL=script.js.map