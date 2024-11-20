import { SendIcon } from "./Icons";

type ChatboxProps = {
  busy: boolean;
  textInputValue: string;
  setTextInputValue: (value: string) => void;
  onSubmit: () => void;
  chatboxRef: React.RefObject<HTMLTextAreaElement>;
};
export const Chatbox = ({
  busy,
  textInputValue,
  setTextInputValue,
  onSubmit,
  chatboxRef,
}: ChatboxProps) => (
  <div
    className="flex items-center bg-slate-100 m-5 shadow-2xl z-10"
    style={{
      position: "absolute",
      bottom: 0,
      right: 0,
      left: 0,
    }}
  >
    <textarea
      className="flex-grow pl-6 pr-12 py-4 border-0 bg-white rounded-lg focus:ring-2 focus:ring-blue-600"
      style={{
        height:
          2 +
          Math.max(1.5, Math.min(textInputValue.split("\n").length * 1.5, 20)) +
          "rem",
      }}
      placeholder="Type a message..."
      value={textInputValue}
      onChange={(e) => setTextInputValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSubmit();
        }
      }}
      ref={chatboxRef}
    />
    <button
      type="button"
      className="absolute right-0 m-2 flex items-center justify-center w-10 h-10 rounded-lg text-slate-300 hover:bg-blue-100 hover:text-blue-600 active:scale-95"
      onClick={onSubmit}
      disabled={busy}
    >
      <SendIcon className="w-6 h-6" />
    </button>
  </div>
);
