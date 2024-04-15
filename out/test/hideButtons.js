"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showButton = exports.hideButton = void 0;
const sendButton = document.getElementById("sendButton");
const copyButton = document.getElementById("copyButton");
const clearButton = document.getElementById("clearButton");
function hideButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.style.display = 'none';
    }
    else {
        console.error(`Button with id ${buttonId} not found.`);
    }
}
exports.hideButton = hideButton;
function showButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.style.display = ''; // Reverts to the default display style
    }
    else {
        console.error(`Button with id ${buttonId} not found.`);
    }
}
exports.showButton = showButton;
//# sourceMappingURL=hideButtons.js.map