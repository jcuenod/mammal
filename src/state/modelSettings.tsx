import { useState } from "react";
import { ModelSettingsContext } from "./modelSettingsContext";

const ModelSettingsContextWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [temperature, setTemperature] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(1012);

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
