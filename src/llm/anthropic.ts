import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/src/resources/messages.js";

import type { GetResponseProps } from "./response";

export const getResponse = async ({
  apiKey,
  baseURL: _baseURL,
  model,
  temperature,
  maxTokens,
  messages,
  onChunk,
  onDone,
}: GetResponseProps) => {
  // We don't use baseurl because it's anthropic...
  const client = new Anthropic({
    apiKey: apiKey,
    // baseURL: baseURL,
    dangerouslyAllowBrowser: true,
  });

  const stream = await client.messages.stream({
    // @ts-ignore
    messages,
    max_tokens: maxTokens,
    temperature: temperature,
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
