import { getResponse as openAiCompat } from "./openai-compat";
import { getResponse as anthropic } from "./anthropic";

const patternMatching = [
  {
    match: (url: string) => /^https:\/\/api.anthropic\.com\//.test(url),
    function: anthropic,
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
    console.log(p);
    console.log(baseURL);
    console.log(p.match(baseURL));
    if (p.match(baseURL)) {
      console.log("here");
      return p.function(apiKey, baseURL, model, messages, onChunk, onDone);
    }
  }
  console.error(`Could not find model based on url: ${baseURL}`);
};
