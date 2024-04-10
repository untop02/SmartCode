"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearChatHistory = exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const openai_1 = require("openai");
const fs = require("node:fs");
const uuid4 = require("uuid4");
function activate(context) {
    console.log('Congratulations, your extension "Smart Code" is now active!');
    const provider = new SmartCodeProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(SmartCodeProvider.viewType, provider));
    context.subscriptions.push(vscode.commands.registerCommand("smartCode.openView", () => {
        vscode.commands.executeCommand("smartCode.codeView.focus");
    }));
}
exports.activate = activate;
class SmartCodeProvider {
    _extensionUri;
    static viewType = "smartCode.codeView";
    _disposables = [];
    _view;
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        const consoleChannel = vscode.window.createOutputChannel("Console");
        webviewView.webview.html = this.getWebContent(webviewView.webview);
        webviewView.webview.onDidReceiveMessage((message) => {
            consoleChannel.append(message);
            if (message.command === "alert") {
                // Start the spinner
                webviewView.webview.postMessage({ command: "displayLoading" });
                this.api(message.text)
                    .then((response) => {
                    // Stop the spinner
                    webviewView.webview.postMessage({ command: "hideLoading" });
                    vscode.window.showInformationMessage(message.text !== "" ? message.text : "No input :(");
                })
                    .catch((error) => {
                    // Stop the spinner
                    webviewView.webview.postMessage({ command: "hideLoading" });
                    // Handle the error
                    console.error("Error:", error);
                });
            }
        });
    }
    openai = new openai_1.default({
        baseURL: "http://koodikeisarit.ddns.net:1234/v1",
        apiKey: getUUID(),
    });
    history = [
        {
            role: "system",
            content: "You are an intelligent assistant. You always provide well-reasoned answers that are both correct and helpful.",
        },
    ];
    async api(input) {
        if (input !== "") {
            const usrInput = { role: "user", content: input };
            this.history.push(usrInput);
            // Send a message to the webview to show the loading message
            this._view?.webview.postMessage({ command: "showLoading" });
            const completion = await this.openai.chat.completions.create({
                messages: this.history,
                model: "gpt-3.5-turbo",
                response_format: { type: "json_object" },
                stream: true,
            });
            const new_message = { role: "assistant", content: "" };
            for await (const chunk of completion) {
                if (chunk.choices[0].delta.content) {
                    new_message.content += chunk.choices[0].delta.content;
                    console.log(new_message.content);
                    this._view?.webview.postMessage({ response: new_message.content });
                }
            }
            // Listen for messages from the webview
            this._view?.webview.onDidReceiveMessage((message) => {
                switch (message.command) {
                    case "clearHistory":
                        this.history = [];
                        break;
                }
            }, undefined, this._disposables);
            // Send a message to the webview to hide the loading message
            this._view?.webview.postMessage({ command: "hideLoading" });
            this.history.push(new_message);
        }
        console.log(this.history);
    }
    getWebContent(webview) {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "style.css"));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "script.js"));
        const htmlUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "src", "extension.html"));
        const html = fs.readFileSync(htmlUri.fsPath, "utf8");
        const htmlContent = html
            .replace("${styleUri}", styleUri.toString())
            .replace("${scriptUri}", scriptUri.toString());
        return htmlContent;
    }
}
function deactivate() { }
exports.deactivate = deactivate;
function getUUID() {
    const filePath = `${__dirname}/user.json`;
    let userData;
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        userData = JSON.parse(fileContent);
    }
    catch (error) {
        // If file does not exist, create a new UUID
        const newUUID = uuid4();
        userData = { userID: newUUID };
        fs.writeFileSync(filePath, JSON.stringify(userData), { flag: "w" });
    }
    return userData.userID;
}
function clearChatHistory() {
    this.history = [];
}
exports.clearChatHistory = clearChatHistory;
//# sourceMappingURL=extension.js.map