const scaleUp = (maxTokens: number) => {
  return Math.round(Math.pow(2, maxTokens / 18));
};
const scaleDown = (logTokens: number) => {
  return Math.round(18 * Math.log2(logTokens));
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
      max="306"
      value={scaleDown(maxTokens)}
      onChange={(e) => setMaxTokens(scaleUp(parseInt(e.target.value)))}
    />
  </div>
);
