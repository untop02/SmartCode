interface Vscode {
  postMessage(message: any): void;
}

declare const vscode: Vscode;
const div = document.getElementsByClassName("chat-container");

function getState(): JSON | string {
  return JSON.parse(localStorage.getItem("smartCodeState") ?? "") || {};
}
function setState(newState: any): void {
  localStorage.setItem("smartCodeState", JSON.stringify(newState));
}
function initializeState(): void {
  const currentState = getState();
}
function sendMessage(): void {
  let inputText = (document.getElementById("uInput") as HTMLInputElement).value;
  vscode.postMessage({ command: "alert", text: inputText });
}
document.getElementById("sendButton")!.addEventListener("click", () => {
  sendMessage();
});

document.addEventListener("DOMContentLoaded", function () {
  initializeState();
});
