"use strict";
class AiApi {
    url;
    apiKey;
    history = [{ "role": "system", "content": "You are an intelligent assistant. You always provide well-reasoned answers that are both correct and helpful." },];
    stream = "";
    constructor(url = "http://boysedating.ddns.net:1234", apiKey = "lm-studio") {
        console.log("init of aiapi class");
        this.url = url;
        this.apiKey = apiKey;
    }
    async call2(input) {
        this.history.push({ "role": "user", "content": input });
        client = OpenAI(base_url = `${url}/v1`, api_key = "lm-studio")
        completion = client.chat.completions.create(
            messages = this.history,
            temperature = 0.7,
        )
        console.log("call2 " + completion.choices[0].message)
    }

    async call(input) {
        console.log("fetching ai response " + input);
        this.history.push({ "role": "user", "content": input });
        const response = await fetch(`${this.url}/v1/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: `{ "messages": ${history.toString}, "temperature": 0.7, "max_tokens": -1,"stream": true}`, });
        const { data, errors } = await response.json();
        if (response.ok) {
            var new_message = { "role": "assistant", "content": "" };
            for await (const chunk of data) {
                process.stdout.write(chunk.choices[0]?.delta?.content || "");
                this.stream += chunk.choices[0]?.delta?.content || "";
                if (chunk.choices[0].delta.content) {
                    new_message["content"] += chunk.choices[0].delta.content;
                }
                ;
            }
            this.history.push(new_message);
        }
        else {
            const error = new Error(errors?.join('\n') ?? 'unknown');
            return Promise.reject(error);
        }
    }
}
export default AiApi;
//# sourceMappingURL=aiApi.js.map