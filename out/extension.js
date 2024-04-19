"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("node:fs"));
const index_1 = __importDefault(require("../node_modules/openai/index"));
const uuid4_1 = __importDefault(require("uuid4"));
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
        //how how the language model acts
        role: "system",
        content: "You are an intelligent assistant. You always provide well-reasoned answers that are both correct and helpful.",
    };
    history = [this.system_message];
    ai_url = "http://koodikeisarit.ddns.net:1234/v1"; //domain where ai api is located, POST commands are accepted
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        const consoleChannel = vscode.window.createOutputChannel("Console");
        webviewView.webview.html = this.getWebContent(webviewView.webview);
        webviewView.webview.onDidReceiveMessage((message) => {
            // If lauseen sisään??
            consoleChannel.append(message);
            switch (message.command) {
                case "alert":
                    this.api(message.text);
                    if (message.text &&
                        message.text.length > 0 &&
                        message.text.trim().length > 0) {
                        vscode.window.showInformationMessage(`Sending: ${message.text}`);
                    }
                    break;
                case "clear": //emptys chat context for ai api
                    this.history = [this.system_message];
                    newConversation();
                    break;
                case "history":
                    getHistory(this._view);
                    break;
            }
        });
    }
    openai = new index_1.default({
        //using openAi library to handle communication
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
                const message = {
                    address: "koodikeisarit",
                    response: "Processing response...",
                    sender: "openAi",
                };
                this._view?.webview.postMessage(message);
                const completion = await this.openai.chat.completions.create({
                    messages: this.history, //sends history array for ai to interpret
                    model: "gpt-3.5-turbo",
                    response_format: { type: "json_object" },
                    stream: true,
                });
                const new_message = { role: "assistant", content: "" }; //ai response object
                for await (const chunk of completion) {
                    //gets reply from ai of user prompt
                    if (chunk.choices[0].delta.content) {
                        new_message.content += chunk.choices[0].delta.content;
                        message.response = new_message.content;
                        this._view?.webview.postMessage(message); //streams reply to html
                    }
                }
                updateHistory(usrInput.content, new_message.content);
                this.history.push(new_message); //saves ai response object to history array for context, allows user to reference previous ai answers
                if (this.history.length > 11) {
                    //prompt history limit of 5 (5 prompt + 5 responses + 1 system rule)
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
        console.log("This is history", this.history);
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
    const conversation = {
        messages: [],
    };
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        userData = JSON.parse(fileContent);
    }
    catch (error) {
        const newUUID = (0, uuid4_1.default)();
        userData = { userID: newUUID, history: [conversation] };
        fs.writeFileSync(filePath, JSON.stringify(userData), { flag: "w" });
    }
    return userData.userID;
}
function readWriteData(filePath, updateCallback) {
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return;
        }
        let currentData;
        try {
            currentData = JSON.parse(data);
        }
        catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            return;
        }
        updateCallback(currentData);
        fs.writeFileSync(filePath, JSON.stringify(currentData), { flag: "w" });
    });
}
function updateHistory(usrInput, answer) {
    const filePath = `${__dirname}/user.json`;
    readWriteData(filePath, (currentData) => {
        const lastConversation = currentData.history[currentData.history.length - 1];
        if (!lastConversation) {
            console.error("No conversation found in search history.");
            return;
        }
        const messages = [...lastConversation.messages, usrInput, answer];
        currentData.history[currentData.history.length - 1] = {
            messages,
        };
    });
}
function newConversation() {
    const filePath = `${__dirname}/user.json`;
    readWriteData(filePath, (currentData) => {
        if (currentData.history[currentData.history.length - 1].messages.length !== 0) {
            console.log("Pushing");
            currentData.history.push({ messages: [] });
        }
    });
}
function getHistory(view) {
    const filePath = `${__dirname}/user.json`;
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return;
        }
        let currentData;
        try {
            currentData = JSON.parse(data);
        }
        catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            return;
        }
        const lastConversation = currentData.history[currentData.history.length - 1];
        const message = {
            address: "koodikeisarit",
            response: lastConversation,
            sender: "history",
        };
        view?.webview.postMessage(message);
    });
}
//# sourceMappingURL=extension.js.map