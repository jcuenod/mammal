import { useEffect, useState } from "react";
import { ModelSettingsContext } from "./modelSettingsContext";

const lsSet = (key: string, value: string) => localStorage.setItem(key, value);
const lsGet = (key: string) => localStorage.getItem(key);

const defaultTemperature = parseFloat(lsGet("temperature") || "0.3");
const defaultMaxTokens = parseInt(lsGet("maxTokens") || "1024");

const ModelSettingsContextWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [temperature, setTemperature] = useState(defaultTemperature);
  const [maxTokens, setMaxTokens] = useState(defaultMaxTokens);

  useEffect(() => lsSet("temperature", temperature.toString()), [temperature]);
  useEffect(() => lsSet("maxTokens", maxTokens.toString()), [maxTokens]);

  const modelSettingsContext = {
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
  };

  return (
    <ModelSettingsContext.Provider value={modelSettingsContext}>
      {children}
    </ModelSettingsContext.Provider>
  );
};
export default ModelSettingsContextWrapper;
