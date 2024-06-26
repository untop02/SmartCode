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
exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("node:fs"));
const index_1 = __importDefault(require("../node_modules/openai/index"));
const uuid4_1 = __importDefault(require("uuid4"));
function activate(context) {
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
    ai_url = "http://koodikeisarit.ddns.net:1234/v1"; //domain where ai api is located
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this.getWebContent(webviewView.webview);
        webviewView.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case "ask":
                    this.api(message.text, message.index);
                    if (message.text &&
                        message.text.length > 0 &&
                        message.text.trim().length > 0) {
                        vscode.window.showInformationMessage(`Sending: ${message.text}`);
                    }
                    break;
                case "newConversation":
                    newConversation();
                    break;
                case "delete": //emptys chat context for ai api
                    this.history = [this.system_message];
                    deleteHistory(this._view);
                    break;
                case "history":
                    getHistory(this._view);
                    break;
                case "context":
                    this.history = switchContext(message.index);
                    this.history.unshift(this.system_message);
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
    async api(input, conversationIndex) {
        if (input !== "" && input !== this.prevInput) {
            this.prevInput = input; //saves input for check to prevent spam
            const usrInput = { role: "user", content: input };
            this.history.push(usrInput); //model reads first user role content starting from end of array
            try {
                this._view?.webview.postMessage(createMessage("Processing response...", "openAi"));
                this._view?.webview.postMessage(createMessage("showSpinner", "spinner"));
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
                        this._view?.webview.postMessage(createMessage(new_message.content, "stream", conversationIndex)); //streams reply to html
                    }
                }
                updateHistory(usrInput.content, new_message.content, conversationIndex);
                this.history.push(new_message); //saves ai response object to history array for context, allows user to reference previous ai answers
                this._view?.webview.postMessage(createMessage([usrInput, new_message], "complete", conversationIndex));
                this._view?.webview.postMessage(createMessage("hideSpinner", "spinner"));
                if (this.history.length > 11) {
                    //prompt history limit of 5 (5 prompt + 5 responses + 1 system rule)
                    this.history.shift(); //removes system prompt
                    this.history.shift(); //removes old prompts and replys from array
                    this.history.shift();
                    this.history.unshift(this.system_message); //inserts system prompt to start of array
                }
            }
            catch (error) {
                console.log("ERROR", error);
                vscode.window.showInformationMessage("Failed to connect");
            }
        }
        else {
            vscode.window.showInformationMessage("Invalid input, please try again");
        }
    }
    // Get HTML content for the webview
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
// Generate a UUID for the user or retrieve it from a JSON file if it exists
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
// Create a message object with specified content, sender, and optional index
function createMessage(response, sender, index) {
    const message = {
        content: response,
        sender: sender,
        index: index,
    };
    return message;
}
// Read data from a JSON file, update it using the provided callback, and write the updated data back to the file
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
// Update the chat history with user input and AI response for a specific conversation
function updateHistory(usrInput, answer, conversationIndex) {
    const filePath = `${__dirname}/user.json`;
    readWriteData(filePath, (currentData) => {
        const reversedHistory = currentData.history.toReversed();
        const conversation = reversedHistory[conversationIndex];
        if (!conversation) {
            console.error("No conversation found in search history.");
            return;
        }
        const user = {
            role: "user",
            content: usrInput,
        };
        const system = {
            role: "assistant",
            content: answer,
        };
        const messages = [...conversation.messages, user, system];
        reversedHistory[conversationIndex] = {
            messages,
        };
        currentData.history = reversedHistory.toReversed();
    });
}
// Start a new conversation by adding an empty conversation object to the chat history
function newConversation() {
    const filePath = `${__dirname}/user.json`;
    readWriteData(filePath, (currentData) => {
        if (currentData.history[currentData.history.length - 1].messages.length !== 0) {
            currentData.history.push({ messages: [] });
        }
    });
}
// Delete all chat history by clearing the history array and adding an empty conversation object
function deleteHistory(view) {
    const filePath = `${__dirname}/user.json`;
    readWriteData(filePath, (currentData) => {
        currentData.history.length = 0;
        currentData.history.push({ messages: [] });
        getHistory(view);
    });
}
// Retrieve the chat history from the JSON file and send it to the webview for display
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
        view?.webview.postMessage(createMessage(currentData.history.toReversed(), "history"));
    });
}
// Retrieve the context history for a specific conversation index
function switchContext(index) {
    const filePath = `${__dirname}/user.json`;
    const file = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const reversedFile = file.history.toReversed();
    const contextHistory = [...reversedFile[index].messages.slice(-4)];
    return contextHistory;
}
//# sourceMappingURL=extension.js.map