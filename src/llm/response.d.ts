export type GetResponseProps = {
  apiKey: string;
  baseURL: string;
  model: string;
  temperature: number;
  maxTokens: number;
  messages: { role: string; content: string }[];
  onChunk: (responseSnapshot: string) => void;
  onDone: (finalResponse: string) => void;
};
