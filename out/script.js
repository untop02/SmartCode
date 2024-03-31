"use strict";
import AiApi from "./aiApi.js";
const ai = new AiApi;
const div = document.getElementsByClassName("chat-container");
function getState() {
    return JSON.parse(localStorage.getItem("smartCodeState") ?? "") || {};
}
function setState(newState) {
    localStorage.setItem("smartCodeState", JSON.stringify(newState));
}
//Pitää ehkä säätää vielä koska poistaa
function initializeState() {
    const currentState = getState();
    let inputField = document.getElementById("uInput");
    inputField.value = currentState;
}
function sendMessage() {
    let inputText = document.getElementById("uInput").value;
    vscode.postMessage({ command: "alert", text: inputText });
    ai.call(inputText);
}
document.getElementById("sendButton").addEventListener("click", () => {
    sendMessage();
});
document.addEventListener("DOMContentLoaded", function () {
    initializeState();
});
document.getElementById("uInput")?.addEventListener("change", () => {
    let inputText = document.getElementById("uInput").value;
    setState(inputText);
});
//# sourceMappingURL=script.js.map