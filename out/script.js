"use strict";
import AiApi from "./aiApi.js"
const vscode = acquireVsCodeApi();

const div = document.getElementsByClassName('chat-container');

const ai = new AiApi.__esModule.valueOf;

function getState() {
    return JSON.parse(localStorage.getItem("smartCodeState")) || {};
}

function setState(newState) {
    localStorage.setItem("smartCodeState", JSON.stringify(newState));
}

function initializeState() {
    const currentState = getState();
}

async function sendMessage() {
    let inputText = document.getElementById("uInput").value;
    vscode.postMessage({ command: "alert", text: inputText });
    await ai.call(inputText)
    console.log("FUk")
}

document.getElementById('sendButton').addEventListener('click', () => {

    sendMessage();
});


document.addEventListener("DOMContentLoaded", function () {
    initializeState();
});
