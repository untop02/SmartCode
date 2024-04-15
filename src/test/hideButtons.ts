const sendButton = document.getElementById("sendButton");
const copyButton = document.getElementById("copyButton");
const clearButton = document.getElementById("clearButton");

export function hideButton(buttonId: string): void {
    const button = document.getElementById(buttonId);
    if (button) {
      button.style.display = 'none';
    } else {
      console.error(`Button with id ${buttonId} not found.`);
    }
  }
  export function showButton(buttonId: string): void {
    const button = document.getElementById(buttonId);
    if (button) {
      button.style.display = ''; // Reverts to the default display style
    } else {
      console.error(`Button with id ${buttonId} not found.`);
    }
  }
  