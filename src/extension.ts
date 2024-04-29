import * as vscode from "vscode";
import * as fs from "node:fs";
import OpenAI from "../node_modules/openai/index";
import type { ChatCompletionMessageParam } from "../node_modules/openai/resources/index";
import uuid4 from "uuid4";

export function activate(context: vscode.ExtensionContext) {
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

  constructor(private readonly _extensionUri: vscode.Uri) { }

  system_message: MessageContent = {
    //how how the language model acts
    role: "system",
    content:
      "You are an intelligent assistant. You always provide well-reasoned answers that are both correct and helpful.",
  };
  history: [MessageContent] = [this.system_message];
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

    webviewView.webview.html = this.getWebContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "ask":
          this.api(message.text, message.index);
          if (
            message.text &&
            message.text.length > 0 &&
            message.text.trim().length > 0
          ) {
            vscode.window.showInformationMessage(`Sending: ${message.text}`);
          }
          break;
        case "clear": //emptys chat context for ai api
          newConversation(this._view);
          break;
        case "delete": //emptys chat context for ai api
          this.history = [this.system_message];
          deleteHistory(this._view);
          break;
        case "history":
          getHistory(this._view);
          break;
        case "context":
          this.history = switchContext(message.index, this.history);
          this.history.unshift(this.system_message);
          console.log("new history", JSON.stringify(this.history));
          break;
      }
    });
  }
  private openai = new OpenAI({
    //using openAi library to handle communication
    baseURL: this.ai_url,
    apiKey: getUUID(),
  });
  private prevInput = "";
  async api(input: string, conversationIndex: number) {
    console.log(this.history);
    if (input !== "" && input !== this.prevInput) {
      this.prevInput = input; //saves input for check to prevent spam
      const usrInput: MessageContent = { role: "user", content: input };
      this.history.push(usrInput); //model reads first user role content starting from end of array
      try {
        this._view?.webview.postMessage(
          createMessage("Processing response...", "openAi")
        );
        this._view?.webview.postMessage(
          createMessage("showSpinner", "spinner")
        );
        const completion = await this.openai.chat.completions.create({
          messages: this.history as ChatCompletionMessageParam[], //sends history array for ai to interpret
          model: "gpt-3.5-turbo",
          response_format: { type: "json_object" },
          stream: true,
        });
        const new_message: MessageContent = { role: "assistant", content: "" }; //ai response object
        for await (const chunk of completion) {
          //gets reply from ai of user prompt
          if (chunk.choices[0].delta.content) {
            new_message.content += chunk.choices[0].delta.content;
            this._view?.webview.postMessage(
              createMessage(new_message.content, "stream")
            ); //streams reply to html
          }
        }
        updateHistory(usrInput.content, new_message.content, conversationIndex);
        this.history.push(new_message); //saves ai response object to history array for context, allows user to reference previous ai answers
        this._view?.webview.postMessage(
          createMessage([usrInput, new_message], "complete")
        );
        this._view?.webview.postMessage(
          createMessage("hideSpinner", "spinner")
        );
        if (this.history.length > 11) {
          //prompt history limit of 5 (5 prompt + 5 responses + 1 system rule)
          this.history.shift(); //removes system prompt
          this.history.shift(); //removes old prompts and replys from array
          this.history.shift();
          this.history.unshift(this.system_message); //inserts system prompt to start of array
        }
      } catch (error) {
        console.log(error);
        vscode.window.showInformationMessage("Failed to connect");
      }
    } else {
      vscode.window.showInformationMessage("Invalid input, please try again");
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

function getUUID(): string {
  const filePath = `${__dirname}/user.json`;
  let userData: UserData;
  const conversation: Conversation = {
    messages: [],
  };
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    userData = JSON.parse(fileContent);
  } catch (error) {
    const newUUID = uuid4();
    userData = { userID: newUUID, history: [conversation] };
    fs.writeFileSync(filePath, JSON.stringify(userData), { flag: "w" });
  }
  return userData.userID;
}

function createMessage(
  response: string | Conversation[] | MessageContent[],
  sender: string
): Message {
  const message: Message = {
    content: response,
    sender: sender,
  };
  return message;
}

function readWriteData(
  filePath: string,
  updateCallback: (currentData: UserData) => void
): void {
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

    updateCallback(currentData);

    fs.writeFileSync(filePath, JSON.stringify(currentData), { flag: "w" });
  });
}

function updateHistory(
  usrInput: string,
  answer: string,
  conversationIndex: number
): void {
  const filePath: string = `${__dirname}/user.json`;

  readWriteData(filePath, (currentData: UserData) => {
    const reversedHistory = currentData.history.toReversed();

    const conversation: Conversation = reversedHistory[conversationIndex];

    if (!conversation) {
      console.error("No conversation found in search history.");
      return;
    }

    const user: MessageContent = {
      role: "user",
      content: usrInput,
    };
    const system: MessageContent = {
      role: "assistant",
      content: answer,
    };
    const messages: MessageContent[] = [...conversation.messages, user, system];

    reversedHistory[conversationIndex] = {
      messages,
    };

    currentData.history = reversedHistory.toReversed();
  });
}

function newConversation(view: vscode.WebviewView | undefined): void {
  const filePath: string = `${__dirname}/user.json`;

  readWriteData(filePath, (currentData: UserData) => {
    if (
      currentData.history[currentData.history.length - 1].messages.length !== 0
    ) {
      console.log("Pushing");
      currentData.history.push({ messages: [] });
      getHistory(view);
    }
  });
}

function deleteHistory(view: vscode.WebviewView | undefined): void {
  const filePath: string = `${__dirname}/user.json`;

  readWriteData(filePath, (currentData: UserData) => {
    currentData.history.length = 0;
    currentData.history.push({ messages: [] });
    getHistory(view);
  });
}



function getHistory(view: vscode.WebviewView | undefined): void {
  const filePath: string = `${__dirname}/user.json`;
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
    view?.webview.postMessage(
      createMessage(currentData.history.toReversed(), "history")
    );
  });
}

function switchContext(
  index: number,
  history: [MessageContent]
): [MessageContent] {
  console.log(`switch Context: ${index}`);
  const filePath = `${__dirname}/user.json`;

  const file: UserData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const reversedFile = file.history.toReversed();

  history = [...reversedFile[index].messages.slice(-4)] as [MessageContent];
  console.log(`switch History: ${JSON.stringify(history)}`);

  return history;
}
