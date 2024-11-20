import { useState } from "react";
import { SendIcon } from "./Icons";

const DEFAULT_HEIGHT = "3.5em";

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
}: ChatboxProps) => {
  const [focus, setFocus] = useState(false);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  console.log("Chatbox rendered", height);
  return (
    <div
      className={
        "flex items-center bg-slate-100 m-5 z-10 " +
        (focus ? "shadow-lg" : "shadow-2xl")
      }
      style={{
        transition: "box-shadow 100ms",
        position: "absolute",
        bottom: 0,
        right: 0,
        left: 0,
      }}
    >
      <textarea
        className="flex-grow pl-6 pr-12 py-4 border-0 bg-white rounded-lg focus:ring-2 focus:ring-blue-600"
        style={{
          height,
        }}
        onInput={(e) => {
          const $target = e.target as HTMLTextAreaElement;
          if ($target.value === "") {
            setHeight(DEFAULT_HEIGHT);
            return;
          }
          const windowHeight = window.innerHeight;
          const idealHeight = Math.min($target.scrollHeight, windowHeight / 2);
          setHeight(idealHeight + "px");
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
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
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
};