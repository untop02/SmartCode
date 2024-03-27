"use strict";
const vscode = acquireVsCodeApi();

const div = document.getElementsByClassName('chat-container');

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


document.addEventListener("DOMContentLoaded", function () {
    initializeState();
});
