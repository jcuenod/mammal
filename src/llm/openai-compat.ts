import OpenAI from "openai";
import type { GetResponseProps } from "./response";

export const getResponse = async ({
  apiKey,
  baseURL,
  model,
  temperature,
  maxTokens,
  messages,
  onChunk,
  onDone,
}: GetResponseProps) => {
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
    dangerouslyAllowBrowser: true,
  });

  try {
    // TODO: Use stream.controller to kill the request after a timeout...
    // const {iterator, controller} = stream ...
    const stream = await client.chat.completions.create({
      // @ts-ignore
      messages,
      model,
      stream: true,
      max_tokens: maxTokens,
      temperature,
    });

    let message = "";
    for await (const response of stream) {
      message += response.choices[0]?.delta?.content || "";
      onChunk(message);
    }

    onDone(message);
  } catch (error) {
    console.error(error);
  }
};
