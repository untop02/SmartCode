import * as vscode from "vscode";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources";
import * as fs from "node:fs";
import uuid4 = require("uuid4");

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "Smart Code" is now active!');

  const provider = new SmartCodeProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SmartCodeProvider.viewType,
      provider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("smartCode.openView", () => {
      vscode.commands.executeCommand("smartCode.codeView.focus");
    })
  );
}

class SmartCodeProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "smartCode.codeView";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  system_message: { role: string; content: string; } = { //how how the language model acts
    role: "system",
    content:
      "You are an intelligent assistant. You always provide well-reasoned answers that are both correct and helpful.",
  };
  history: [{ role: string; content: string; }] = [
    this.system_message,
  ];
  ai_url = "http://koodikeisarit.ddns.net:1234/v1"; //domain where ai api is located, POST commands are accepted


  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
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
          vscode.window.showInformationMessage(
            message.text !== "" ? `Sending: ${message.text}` : "No input :("
          );
          break;
        case "clear": //emptys chat context for ai api
          this.history = [
            this.system_message
          ];
          newConversation();
          break;
      }
    });
  }
  private openai = new OpenAI({//using openAi library to handle communication
    baseURL: this.ai_url,
    apiKey: getUUID(),
  });
  private prevInput = "";
  async api(input: string) {
    if (input !== "" && input !== this.prevInput) {
      this.prevInput = input; //saves input for check to prevent spam
      const usrInput = { role: "user", content: input };
      this.history.push(usrInput);//model reads first user role content starting from end of array
      try {
        this._view?.webview.postMessage({ response: "Processing response..." });
        const completion = await this.openai.chat.completions.create({
          messages: this.history as ChatCompletionMessageParam[], //sends history array for ai to interpret
          model: "gpt-3.5-turbo",
          response_format: { type: "json_object" },
          stream: true,
        });
        const new_message = { role: "assistant", content: "" }; //ai response object
        for await (const chunk of completion) {//gets reply from ai of user prompt
          if (chunk.choices[0].delta.content) {
            new_message.content += chunk.choices[0].delta.content;
            this._view?.webview.postMessage({ response: new_message.content });//streams reply to html
          }
        }
      updateHistory(usrInput.content, new_message.content);
        this.history.push(new_message);//saves ai response object to history array for context, allows user to reference previous ai answers
        if (this.history.length > 11) { //prompt history limit of 5 (5 prompt + 5 responses + 1 system rule)
          this.history.shift();//removes system prompt
          this.history.shift();//removes old prompts and replys from array
          this.history.shift();
          this.history.unshift(this.system_message);//inserts system prompt to start of array
        }

      } catch (error) {
        console.log(error);
        vscode.window.showInformationMessage("Failed to connect");
      }


    } else {
      vscode.window.showInformationMessage(
        "Invalid input, please try again"
      );
    }
    console.log("This is history", this.history);
  }

  private getWebContent(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "style.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "script.js")
    );
    const htmlUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "extension.html")
    );

    const html = fs.readFileSync(htmlUri.fsPath, "utf8");

    const htmlContent = html
      .replace("${styleUri}", styleUri.toString())
      .replace("${scriptUri}", scriptUri.toString());

    return htmlContent;
  }
}
export function deactivate() {}

function getUUID(): string {
  const filePath = `${__dirname}/user.json`;
  let userData: UserData;
  const conversation: Conversation = {
    messages: []
  };
    try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    userData = JSON.parse(fileContent);
  } catch (error) {
    const newUUID = uuid4();
    userData = { userID: newUUID, searchHistory: [conversation] };
    fs.writeFileSync(filePath, JSON.stringify(userData), { flag: "w" });
  }
  return userData.userID; 
}

function updateHistory(usrInput: string, answer: string) {
  const filePath = `${__dirname}/user.json`;

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }

    let currentData: UserData;

    try {
      currentData = JSON.parse(data);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return;
    }
    const latestConversation = currentData.searchHistory[currentData.searchHistory.length -1];
    console.log(latestConversation);
    
    const conversation: Conversation = {
      messages: latestConversation.messages
    };

    // Update history
    conversation.messages.push(usrInput,answer);
    console.log("Current data: ", currentData.searchHistory);
    currentData.searchHistory[currentData.searchHistory.length -1] = conversation;
    // Write the updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(currentData), { flag: "w" });

    // Log the updated file contents
    console.log(fs.readFileSync(filePath, "utf-8"));
  });
}
function newConversation() {
  const filePath = `${__dirname}/user.json`;
  const newConversation: Conversation = {
    messages: []
  };

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }

    let currentData: UserData;

    try {
      currentData = JSON.parse(data);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return;
    }
    currentData.searchHistory.push(newConversation);
    fs.writeFileSync(filePath, JSON.stringify(currentData), { flag: "w" });
  });
}

interface UserData {
  userID: string;
  searchHistory: Array<Conversation>;
}
interface Conversation {
  primaryQuestion?: string;
  messages: Array<string>;
}
