"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
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
    _view;
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    system_message = {
        role: "system",
        content: "You are an intelligent assistant. You always provide well-reasoned answers that are both correct and helpful.",
    };
    history = [
        this.system_message,
    ];
    ai_url = "http://koodikeisarit.ddns.net:1234/v1"; //domain where ai api is located, POST commands are accepted
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
            switch (message.command) {
                case "alert":
                    this.api(message.text);
                    vscode.window.showInformationMessage(message.text !== "" ? "Sending: " + message.text : "No input :(");
                    break;
                case "clear": //emptys chat context for ai api
                    this.history = [
                        this.system_message
                    ];
                    break;
            }
        });
    }
    openai = new openai_1.default({
        baseURL: this.ai_url,
        apiKey: getUUID(),
    });
    prevInput = "";
    async api(input) {
        if (input !== "" && input !== this.prevInput) {
            this.prevInput = input; //saves input for check to prevent spam
            const usrInput = { role: "user", content: input };
            this.history.push(usrInput); //model reads first user role content starting from end of array
            try {
                this._view?.webview.postMessage({ response: { info: "stream", text: "Processing response..." } });
                const completion = await this.openai.chat.completions.create({
                    messages: this.history, //sends history array for ai to interpret
                    model: "gpt-3.5-turbo",
                    response_format: { type: "json_object" },
                    stream: true,
                });
                const new_message = { role: "assistant", content: "" }; //ai response object
                for await (const chunk of completion) { //gets reply from ai of user prompt
                    if (chunk.choices[0].delta.content) {
                        new_message.content += chunk.choices[0].delta.content;
                        this._view?.webview.postMessage({ response: { info: "stream", text: new_message.content } }); //streams reply to html
                    }
                }
                this.history.push(new_message); //saves ai response object to history array for context, allows user to reference previous ai answers
                this._view?.webview.postMessage({ response: { info: "complete", text: this.history } });
                if (this.history.length > 11) { //prompt history limit of 5 (5 prompt + 5 responses + 1 system rule)
                    this.history.shift(); //removes system prompt
                    this.history.shift(); //removes old prompts and replys from array
                    this.history.shift();
                    this.history.unshift(this.system_message); //inserts system prompt to start of array
                }
            }
            catch (error) {
                console.log(error);
                vscode.window.showInformationMessage("Failed to connect");
            }
        }
        else {
            vscode.window.showInformationMessage("Invalid input, please try again");
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
//# sourceMappingURL=extension.js.map