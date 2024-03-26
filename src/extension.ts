import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "Smart Code" is now active!');

  const provider = new SmartCodeProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SmartCodeProvider.viewType,
      provider
    )
  );
  //Pitää korjata että voi avata taas hotkeyllä
  context.subscriptions.push(
    vscode.commands.registerCommand("smartCode.open", () => {})
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

    let consoleChannel = vscode.window.createOutputChannel("Console");

    webviewView.webview.html = this.getWebContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message) => {
      consoleChannel.append(message);
      if (message.command === "alert") {
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

export function deactivate() {}
