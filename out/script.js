function setState(newState) {
  localStorage.setItem("smartCodeState", JSON.stringify(newState));
}

function initializeState() {
  const currentState = getState();
  inputField.value = currentState;
}

function sendMessage() {
  let inputText = document.getElementById("uInput").value;
  document.getElementById("loading").style.display = "block"; // Show loading
  vscode.postMessage({ command: "alert", text: inputText });
  inputField.value = "";
}

// New function to handle the response
window.addEventListener("message", (event) => {
  document.getElementById("loading").style.display = "none"; // Hide loading
  const message = event.data; // The JSON data our extension sent
  display.textContent = message.response;
});

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
  const inputText = document.getElementById("uInput").value;
  setState(inputText);
});

document.getElementById("clearButton").addEventListener("click", () => {
  vscode.postMessage({
    command: "clearChat",
  });
});

window.addEventListener("message", (event) => {
  const message = event.data;
  switch (message.command) {
    case "chatCleared":
      // Clear the chat display
      display.textContent = "";
      break;
  }
});
