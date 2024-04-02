interface Vscode {
  postMessage(message: object): void;
}

declare const vscode: Vscode;
const div = document.getElementsByClassName("chat-container");
const sendButton = document.getElementById("sendButton");
const inputField = document.getElementById("uInput") as HTMLInputElement;

function getState(): JSON | string {
  return JSON.parse(localStorage.getItem("smartCodeState") ?? "");
}

function setState(newState: string): void {
  localStorage.setItem("smartCodeState", JSON.stringify(newState));
}

//Pitää ehkä säätää vielä koska poistaa
function initializeState(): void {
  const currentState = getState();
  inputField.value = currentState as string;
}

function sendMessage(): void {
  vscode.postMessage({ command: "alert", text: inputField.value });
  inputField.value = "";
}

sendButton?.addEventListener("click", () => {
  sendMessage();
});

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
});

document.getElementById("uInput")?.addEventListener("change", () => {
  const inputText = (document.getElementById("uInput") as HTMLInputElement)
    .value;
  setState(inputText);
});
