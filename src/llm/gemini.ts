import type { GetResponseProps } from "./response";

const removeFinalSlash = (baseUrl: string) =>
  baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

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
  // @ts-ignore
  const stream = await window.originalFetch(
    `${removeFinalSlash(baseURL)}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
      }),
    }
  );

  //   Process stream from fetch
  const reader = stream.body?.getReader();
  const decoder = new TextDecoder();
  let messageSnapshot = "";
  while (true) {
    if (!reader) {
      console.error("Reader is null");
      break;
    }
    const { done, value } = await reader.read();
    if (done) {
      onDone(messageSnapshot);
      break;
    }
    try {
      const decodedValue = decoder
        .decode(value)
        .replace(/data: /, "")
        .trim();
      // Sometimes we end up with `data: ${messageSnapshot}\n\ndata: [DONE]`, thus the `.endsWith` check.
      if (decodedValue === "[DONE]" || decodedValue.endsWith("data: [DONE]")) {
        onDone(messageSnapshot);
        break;
      }
      const response = JSON.parse(decodedValue);
      const delta = response.choices[0]?.delta?.content || "";
      messageSnapshot += delta;
      onChunk(messageSnapshot);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      onDone(messageSnapshot + "\n\n(An error occurred)");
      break;
    }
  }
};
