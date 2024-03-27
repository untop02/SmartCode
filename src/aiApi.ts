import OpenAI from "openai";
import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions';

export default class AiApi {
    url:string;
    apiKey:string;
    private history:ChatCompletionMessageParam[]  = [{ "role": "system", "content": "You are an intelligent assistant. You always provide well-reasoned answers that are both correct and helpful." },];
    stream:string = "";
    constructor(url = "http://localhost:1234/v1", apiKey = "lm-studio"){
        console.log("init of aiapi class");
        this.url = url;
        this.apiKey = apiKey;
    }
    
    async call(this: AiApi, input:string) {
        console.log("I AM DOING SOMETHING");
        const openai = new OpenAI({ baseURL: this.url, apiKey: this.apiKey });
        this.history.push({ "role": "user", "content": input } as ChatCompletionMessageParam);
        const stream = await openai.chat.completions.create({
            model: "gpt-4",
            messages: this.history,
            temperature: 0.7,
            stream: true,
        });
        var new_message = {"role": "assistant", "content": ""};
        for await (const chunk of stream) {
            process.stdout.write(chunk.choices[0]?.delta?.content || "");
            this.stream += chunk.choices[0]?.delta?.content || "";
            if (chunk.choices[0].delta.content){new_message["content"] += chunk.choices[0].delta.content;};
        }
        this.history.push(new_message as ChatCompletionMessageParam);
    }

}