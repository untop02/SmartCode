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

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
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
      if (message.command === "alert") {
        this.api(message.text);
        vscode.window.showInformationMessage(
          message.text !== "" ? message.text : "No input :("
        );
      }
    });
  }
  private openai = new OpenAI({
    baseURL: "http://koodikeisarit.ddns.net:1234/v1",
    apiKey: getUUID(),
  });
  history = [
    {
      role: "system",
      content:
        "You are an intelligent assistant. You always provide well-reasoned answers that are both correct and helpful.",
    },
  ];
  async api(input: string) {
    if (input !== "") {
      const usrInput = { role: "user", content: input };
      this.history.push(usrInput);

      // Send a message to the webview to show the loading message
      this._view?.webview.postMessage({ command: "showLoading" });

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
          console.log(new_message.content);
          this._view?.webview.postMessage({ response: new_message.content });
        }
      }

      // Send a message to the webview to hide the loading message
      this._view?.webview.postMessage({ command: "hideLoading" });

      this.history.push(new_message);
    }
    console.log(this.history);
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

  let userData: { userID: string };

  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    userData = JSON.parse(fileContent);
  } catch (error) {
    // If file does not exist, create a new UUID
    const newUUID = uuid4();
    userData = { userID: newUUID };
    fs.writeFileSync(filePath, JSON.stringify(userData), { flag: "w" });
  }

  return userData.userID;
}
export function clearChatHistory(this: SmartCodeProvider) {
  this.history = [];
}
