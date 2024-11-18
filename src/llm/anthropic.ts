import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/src/resources/messages.js";

export const getResponse = async (
  apiKey: string,
  _baseURL: string,
  model: string,
  messages: { role: string; content: string }[],
  onChunk: (responseSnapshot: string) => void,
  onDone: (finalResponse: string) => void
) => {
  // We don't use baseurl because it's anthropic...
  const client = new Anthropic({
    apiKey: apiKey,
    // baseURL: baseURL,
    dangerouslyAllowBrowser: true,
  });

  const stream = await client.messages.stream({
    // @ts-ignore
    messages,
    max_tokens: 1024,
    model,
    stream: true,
  });

  stream.on("text", (_textDelta: string, textSnapshot: string) => {
    onChunk(textSnapshot);
  });

  stream.on("message", (message: Message) => {
    const contentBlock = message.content[0];
    const text = "text" in contentBlock ? contentBlock.text : "";
    onDone(text);
  });
};
