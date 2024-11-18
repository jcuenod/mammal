const removeFinalSlash = (baseUrl: string) =>
  baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

export const getResponse = async (
  apiKey: string,
  baseURL: string,
  model: string,
  messages: { role: string; content: string }[],
  onChunk: (responseSnapshot: string) => void,
  onDone: (finalResponse: string) => void
) => {
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
      if (decodedValue === "[DONE]") {
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
