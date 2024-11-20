// maxTokens is a linear scale but we want to convert it to a log scale
const maxTokensToLogScale = (maxTokens: number) => {
  return Math.round(Math.exp(maxTokens / 25));
};
// inverse of maxTokensToLogScale
const logScaleToMaxTokens = (logTokens: number) => {
  return Math.round(25 * Math.log(logTokens));
};

type ModelSettingsProps = {
  temperature: number;
  setTemperature: (temperature: number) => void;
  maxTokens: number;
  setMaxTokens: (maxTokens: number) => void;
};
export const ModelSettingsMenu = ({
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
}: ModelSettingsProps) => (
  <div className="p-4 flex flex-col w-56">
    <div className="flex items-center justify-between">
      <span className="font-bold">Temperature</span>
      <span className="border-2 border-slate-100 bg-slate-50 p-1 rounded min-w-10 text-center">
        {temperature}
      </span>
    </div>
    <input
      className="w-full"
      type="range"
      min="0"
      max="2"
      step="0.1"
      value={temperature}
      onChange={(e) => setTemperature(parseFloat(e.target.value))}
    />
    <div className="flex items-center justify-between mt-4">
      <span className="font-bold">Max Tokens</span>
      <span className="border-2 border-slate-100 bg-slate-50 p-1 rounded min-w-10 text-center">
        {maxTokens}
      </span>
    </div>
    <input
      className="w-full"
      type="range"
      min="1"
      max="300"
      value={logScaleToMaxTokens(maxTokens)}
      onChange={(e) =>
        setMaxTokens(maxTokensToLogScale(parseInt(e.target.value)))
      }
    />
  </div>
);
