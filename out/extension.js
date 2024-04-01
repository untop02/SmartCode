"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const openai_1 = require("openai");
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
        let consoleChannel = vscode.window.createOutputChannel("Console");
        webviewView.webview.html = this.getWebContent(webviewView.webview);
        webviewView.webview.onDidReceiveMessage((message) => {
            consoleChannel.append(message);
            if (message.command === "alert") {
                this.api(message.text);
                vscode.window.showInformationMessage(message.text !== "" ? message.text : "No input :(");
            }
        });
    }
    openai = new openai_1.default({ baseURL: "http://boysedating.ddns.net:1234/v1", apiKey: "lm-studio" });
    history = [
        { "role": "system", "content": "You are an intelligent assistant. You always provide well-reasoned answers that are both correct and helpful." },
    ];
    async api(input) {
        if (input !== "") {
            var usrInput = { "role": "user", "content": input };
            this.history.push(usrInput);
            const completion = await this.openai.chat.completions.create({
                messages: this.history,
                model: "gpt-3.5-turbo",
                response_format: { type: "json_object" },
                stream: true,
            });
            var new_message = { "role": "assistant", "content": "" };
            for await (const chunk of completion) {
                if (chunk.choices[0].delta.content) {
                    new_message.content += chunk.choices[0].delta.content;
                    console.log(new_message.content);
                    this._view?.webview.postMessage({ response: new_message.content });
                }
            }
            this.history.push(new_message);
        }
    }
    getWebContent(webview) {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "style.css"));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "script.js"));
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" type="text/css" href="${styleUri}">
            <title>Smart Code</title>
        </head>
        <body>
        <script>const vscode = acquireVsCodeApi();
        </script>
            <header>
                <img src="https://i.imgur.com/kycO1SS.gif"
                    alt="" srcset="" width="300">
                <p id='p1'>This has some text to show to the user</p>
                <script>
        const display = document.getElementById('p1');

        // Handle the message inside the webview
        window.addEventListener('message', event => {

            const message = event.data; // The JSON data our extension sent
            display.textContent = message.response
        });
    </script>
            </header>

            <div class="chat-container">
                <!-- Chat content goes here -->
            </div>

            <footer>
                <div class="footer-container">
                <div class="input-container">
                    <textarea type="text" id="uInput" placeholder="Ask SmartCode..." rows="20" cols="50"></textarea>
                    </div>
                    <div class="button-container">
                    <button type="button" id="sendButton">Send</button>
                    </div>
                </div>
            </footer>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map