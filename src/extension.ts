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

  history = [
    {
      role: "system",
      content:
        "You are an intelligent assistant. You always provide well-reasoned answers that are both correct and helpful.",
    },
  ];

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
            message.text !== "" ? message.text : "No input :("
          );
          break;
        case "clear":
          this.history = [
            {
              role: "system",
              content:
                "You are an intelligent assistant. You always provide well-reasoned answers that are both correct and helpful.",
            },
          ];
          break;
      }
    });
  }
  private openai = new OpenAI({
    baseURL: "http://koodikeisarit.ddns.net:1234/v1",
    apiKey: getUUID(),
  });
  async api(input: string) {
    if (input !== "") {
      const usrInput = { role: "user", content: input };
      this.history.push(usrInput);
      const completion = await this.openai.chat.completions.create({
        messages: this.history as ChatCompletionMessageParam[],
        model: "gpt-3.5-turbo",
        response_format: { type: "json_object" },
        stream: true,
      });
      const new_message = { role: "assistant", content: "" };
      for await (const chunk of completion) {
        if (chunk.choices[0].delta.content) {
          new_message.content += chunk.choices[0].delta.content;
          this._view?.webview.postMessage({ response: new_message.content });
        }
      }
      updateHistory(usrInput.content, new_message.content);
      this.history.push(new_message);
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
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    userData = JSON.parse(fileContent);
  } catch (error) {
    const newUUID = uuid4();
    userData = { userID: newUUID, searchHistory: [] };
    fs.writeFileSync(filePath, JSON.stringify(userData), { flag: "w" });
  }
  return userData.userID;
}

function updateHistory(usrInput: string, new_message: string) {
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

    // Update history
    currentData.searchHistory.push(usrInput,new_message)
    console.log("Current data: ", currentData.searchHistory);

    // Write the updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(currentData), { flag: "w" });

    // Log the updated file contents
    console.log(fs.readFileSync(filePath, "utf-8"));
  });
}

interface UserData {
  userID: string;
  searchHistory: Array<string>;
}
interface Conversation {
  primaryQuestion?: string;
  questions: Array<string>;
}
