interface Message {
  response: string | Conversation;
  sender: string;
}
interface UserData {
  userID: string;
  history: Array<Conversation>;
}
interface Conversation {
  primaryQuestion?: string;
  messages: Array<string>;
}
