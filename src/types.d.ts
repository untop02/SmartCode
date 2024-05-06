interface Message {
  content: string | Conversation[] | MessageContent[];
  sender: string;
  index?: number;
}
interface MessageContent {
  role: string;
  content: string;
  index?: number;
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
  storedConversations: Conversation[];
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
