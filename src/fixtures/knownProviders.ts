type KnownProvider = {
  icon?: string;
  name: string;
  endpoint: string;
  models: {
    name: string;
    model: string;
  }[];
};
export const knownProviders: KnownProvider[] = [
  {
    icon: "🔥",
    name: "OpenAI",
    endpoint: "https://api.openai.com/v1/",
    models: [
      { name: "GPT-4o", model: "gpt-4o" },
      { name: "GPT-4o Mini", model: "gpt-4o-mini" },
      { name: "GPT-4 Turbo", model: "gpt-4-turbo" },
      { name: "GPT-4", model: "gpt-4" },
      { name: "GPT-3.5 Turbo", model: "gpt-3.5-turbo" },
    ],
  },
  {
    icon: "🦙",
    name: "Cerebras",
    endpoint: "https://api.cerebras.ai/v1/",
    models: [
      { name: "Llama 3.3 70B", model: "llama-3.3-70b" },
      { name: "Llama 3.1 70B", model: "llama3.1-70b" },
      { name: "Llama 3.1 8B", model: "llama3.1-8b" },
    ],
  },
  {
    icon: "🔮",
    name: "Groq",
    endpoint: "https://api.groq.com/openai/v1/",
    models: [
      { name: "Llama 3.3 70B", model: "llama-3.3-70b-versatile" },
      { name: "Llama 3.1 70B", model: "llama3-70b-8192" },
      { name: "Llama 3.1 8B", model: "llama-3.1-8b-instant" },
    ],
  },
  {
    icon: "🎨",
    name: "Anthropic",
    endpoint: "https://api.anthropic.com/v1/",
    models: [
      { name: "Claude 3.5 Sonnet", model: "claude-3-5-sonnet-20241022" },
      { name: "Claude 3.5 Haiku", model: "claude-3-5-haiku-20241022" },
      { name: "Claude 3 Opus", model: "claude-3-opus-20240229" },
    ],
  },
  {
    icon: "🌌",
    name: "Google",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/",
    models: [
      { name: "Gemini Exp 1206 (Preview)", model: "gemini-exp-1206" },
      { name: "Gemini 2.0 Flash (Preview)", model: "gemini-2.0-flash-exp" },
      { name: "Gemini 1.5 Pro 002", model: "gemini-1.5-pro-002" },
      { name: "Gemini Pro 1.5", model: "gemini-pro-1.5" },
      { name: "Gemini 1.5 Flash", model: "gemini-1.5-flash" },
      { name: "Gemini 1.5 Flash 002", model: "gemini-1.5-flash-002" },
      { name: "Gemini 1.5 Flash 8B", model: "gemini-1.5-flash-8b" },
    ],
  },
];
