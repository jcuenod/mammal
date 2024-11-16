import OpenAI from "openai";

export const getResponse = async (
  apiKey: string,
  baseURL: string,
  model: string,
  messages: { role: string; content: string }[],
  onChunk: (responseSnapshot: string) => void,
  onDone: (finalResponse: string) => void
) => {
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
    dangerouslyAllowBrowser: true,
  });

  const stream = client.beta.chat.completions.stream({
    // @ts-ignore
    messages,
    model,
    stream: true,
  });

  stream.on("content", (_delta, snapshot) => {
    onChunk(snapshot);
  });

  stream.on("content.done", ({ content }) => {
    onDone(content);
  });
};
