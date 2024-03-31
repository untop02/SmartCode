import * as vscode from "vscode";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
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
class aiApi {
  private openai = new OpenAI({ baseURL: "http://boysedating.ddns.net:1234/v1", apiKey: "lm-studio" });
  history = [
    { "role": "system", "content": "You are an intelligent assistant. You always provide well-reasoned answers that are both correct and helpful." },
  ];
  currentMessage = "";
  async api(input: string) {
    if (input !== "") {
      var usrInput = { "role": "user", "content": input };
      this.history.push(usrInput);
      const completion = await this.openai.chat.completions.create({
        messages: this.history as ChatCompletionMessageParam[],
        model: "gpt-3.5-turbo",
        response_format: { type: "json_object" },
        stream: true,
      });
      var new_message = { "role": "assistant", "content": "" };
      for await (const chunk of completion) {
        if (chunk.choices[0].delta.content) {
          new_message["content"] += chunk.choices[0].delta.content;
          console.log(new_message.content);
          this.currentMessage = new_message.content;
        };
      }
      this.history.push(new_message);

    }

  }
}

class SmartCodeProvider implements vscode.WebviewViewProvider {
  ai = new aiApi;
  public static readonly viewType = "smartCode.codeView";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) { }

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

    let consoleChannel = vscode.window.createOutputChannel("Console");

    webviewView.webview.html = this.getWebContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message) => {
      consoleChannel.append(message);
      if (message.command === "alert") {
        this.ai.api(message.text);
        vscode.window.showInformationMessage(
          message.text !== "" ? message.text : "No input :("
        );
      }
    });
  }

  private getWebContent(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "style.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "script.js")
    );

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
                <h1>Smart Code</h1>
                <img src="https://www.rollingstone.com/wp-content/uploads/2022/04/nicolas-cage-on-nicolas-cage-massive-talent.jpg?w=1581&h=1054&crop=1"
                    alt="" srcset="" width="300">
                <p id='p1'>This has some text to show to the user</p>
            </header>

            <div class="chat-container">
                <!-- Chat content goes here -->
            </div>

            <footer>
                <div class="footer-container">
                    <input type="text" id="uInput" placeholder="Ask SmartCode..."></input>
                    <button type="button" id="sendButton">Send Text</button>
                </div>
            </footer>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
  }
}

export function deactivate() { }
