import AiApi from "./aiApi";
const ai = new AiApi;
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
//Pitää ehkä säätää vielä koska poistaa
function initializeState(): void {
  const currentState = getState();
  let inputField = document.getElementById("uInput") as HTMLInputElement;
  inputField.value = currentState as string;
}
function sendMessage(): void {
  let inputText = (document.getElementById("uInput") as HTMLInputElement).value;
  vscode.postMessage({ command: "alert", text: inputText });
  ai.call(inputText);
}
document.getElementById("sendButton")!.addEventListener("click", () => {
  sendMessage();
});

document.addEventListener("DOMContentLoaded", function () {
  initializeState();
});
document.getElementById("uInput")?.addEventListener("change", () => {
  let inputText = (document.getElementById("uInput") as HTMLInputElement).value;
  setState(inputText);
});
