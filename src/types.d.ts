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
  primaryQuestion?: string;
  messages: MessageContent[];
}
