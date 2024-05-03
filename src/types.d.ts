interface Message {
  content: string | Conversation[] | MessageContent[];
  sender: string;
}
interface MessageContent {
  role: string;
  content: string;
}

interface UserData {
  userID: string;
  history: Conversation[];
}
interface Conversation {
  messages: MessageContent[];
}
interface SavedState {
  historyIndex?: number;
}

interface GlobalState {
  currentState: SavedState;
  story: string[];
}

interface Story {
  story: string[];
  clearStory(): void;
}

interface Vscode {
  postMessage(message: object): void;
}
