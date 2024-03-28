"use strict";
import AiApi from "./aiApi.js"
const div = document.getElementsByClassName("chat-container");

const ai = new AiApi.__esModule.valueOf;
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
async function sendMessage() {
    let inputText = document.getElementById("uInput").value;
    vscode.postMessage({ command: "alert", text: inputText });
    await ai.call(inputText)
    console.log("FUk")
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