import { createContext } from "react";

type ModelSettingsContext = {
  maxTokens: number;
  setMaxTokens: (maxTokens: number) => void;
  temperature: number;
  setTemperature: (temperature: number) => void;
};
export const ModelSettingsContext = createContext<ModelSettingsContext>({
  maxTokens: 0,
  temperature: 0,
  setMaxTokens: () => console.warn("Not yet initialized"),
  setTemperature: () => console.warn("Not yet initialized"),
});
