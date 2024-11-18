import { getResponse as openAiCompat } from "./openai-compat";
import { getResponse as anthropic } from "./anthropic";
import { getResponse as gemini } from "./gemini";

const patternMatching = [
  {
    match: (url: string) => /^https:\/\/api.anthropic\.com\//.test(url),
    function: anthropic,
  },
  {
    match: (url: string) =>
      /^https:\/\/generativelanguage\.googleapis\.com\//.test(url),
    function: gemini,
  },
  {
    match: () => true,
    function: openAiCompat,
  },
];

export const getResponse = (
  apiKey: string,
  baseURL: string,
  model: string,
  messages: { role: string; content: string }[],
  onChunk: (responseSnapshot: string) => void,
  onDone: (finalResponse: string) => void
) => {
  for (const p of patternMatching) {
    if (p.match(baseURL)) {
      return p.function(apiKey, baseURL, model, messages, onChunk, onDone);
    }
  }
  console.error(`Could not find model based on url: ${baseURL}`);
};
