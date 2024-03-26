"use strict";
const vscode = acquireVsCodeApi();

function getState() {
    return JSON.parse(localStorage.getItem("smartCodeState")) || {};
}

function setState(newState) {
    localStorage.setItem("smartCodeState", JSON.stringify(newState));
}

function initializeState() {
    const currentState = getState();
}

function sendMessage() {
    let inputText = document.getElementById("uInput").value;
    vscode.postMessage({ command: "alert", text: inputText });
}

document.getElementById('sendButton').addEventListener('click', () => {
    sendMessage();
});

window.addEventListener('message', event => {
    const message = event.data;
    if (message.type === 'alert') {
        sendMessage();
    }
});

document.addEventListener("DOMContentLoaded", function () {
    initializeState();
});
