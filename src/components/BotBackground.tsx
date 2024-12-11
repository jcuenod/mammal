import { MammalIcon } from "./Icons";

export const BotBackground = () => (
  <div className="absolute left-0 right-0 top-0 bottom-0 overflow-hidden flex flex-col items-center justify-center text-slate-200">
    <MammalIcon className="w-96 h-96" />
    <div className="text-5xl font-bold font-sans">mammal</div>
  </div>
);
