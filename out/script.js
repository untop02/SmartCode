"use strict";
const div = document.getElementsByClassName("chat-container");
const sendButton = document.getElementById("sendButton");
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
sendButton?.addEventListener("click", () => {
    sendMessage();
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