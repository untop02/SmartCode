// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "Smart Code" is now active!');
  let consoleChannel = vscode.window.createOutputChannel("Console");
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "firstextension.smartCode",
    function () {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage("Smart Code go BRR");
      //Creates new Tab
      const panel = vscode.window.createWebviewPanel(
        "SmartCode",
        "Visual Studio Text Extension",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = getWebContent(context);

      panel.webview.onDidReceiveMessage((message) => {
        consoleChannel.append(message);
        if (message.command === "alert") {
          vscode.window.showInformationMessage(message.text);
        }
      });
    }
  );
  context.subscriptions.push(disposable);

  function getWebContent(context: vscode.ExtensionContext): string {
    const htmlPath = vscode.Uri.joinPath(
      context.extensionUri,
      "src\\extension.html"
    );

    const htmlContent = fs.readFileSync(htmlPath.fsPath, "utf8");

    return htmlContent;
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
