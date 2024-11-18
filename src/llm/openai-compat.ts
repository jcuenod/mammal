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

  try {
    // TODO: Use stream.controller to kill the request after a timeout...
    // const {iterator, controller} = stream ...
    const stream = await client.chat.completions.create({
      // @ts-ignore
      messages,
      model,
      stream: true,
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
