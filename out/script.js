"use strict";
const div = document.getElementsByClassName("chat-container");
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearButton");
const inputField = document.getElementById("uInput");
const copyButton = document.getElementById("copyButton");
const text = document.getElementById("p1");
const loadingSpinner = document.getElementById("loadingSpinner");
let text = document.getElementById("p1");
function getState() {
  return JSON.parse(localStorage.getItem("smartCodeState") ?? "");
}
function setState(newState) {
  localStorage.setItem("smartCodeState", JSON.stringify(newState));
}
function initializeState() {
  const currentState = getState();
  inputField.value = currentState;
  loadingSpinner.style.display = "none";
}
function sendMessage() {
  vscode.postMessage({ command: "alert", text: inputField.value });
  loadingSpinner.style.display = "block";
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
async function setClipboard(text) {
  const type = "text/plain";
  const blob = new Blob([text], { type });
  const data = [new ClipboardItem({ [type]: blob })];
  await navigator.clipboard.write(data);
  loadingSpinner.style.display = "block";
}
document?.addEventListener("keypress", (event) => {
  if (event.key === "Enter" && event.shiftKey !== true) {
    sendMessage();
  } else if (event.key === "Enter" && event.shiftKey === true) {
    const inputText = inputField.value;
    inputText.concat("\n");
  }
});
document.addEventListener("DOMContentLoaded", () => {
  initializeState();
  loadingSpinner.style.display = "none";
});
document.getElementById("uInput")?.addEventListener("change", () => {
  const inputText = document.getElementById("uInput").value;
  setState(inputText);
});
copyButton?.addEventListener("click", () =>
  setClipboard(text?.textContent ?? "")
);
//# sourceMappingURL=script.js.map
