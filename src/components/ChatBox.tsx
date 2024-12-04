import { useContext, useEffect, useState } from "react";
import { PaperclipIcon, SendIcon } from "./Icons";
import { open } from "@tauri-apps/plugin-dialog";
import { getAttachmentTemplate, readDocument } from "../util/attach";
import { DropReadyContext } from "../state/dropReadyContextProvider";

const DEFAULT_HEIGHT = "3.5em";
const FILE_ATTACHMENT_FILTERS = [
  {
    name: "All Supported Files",
    extensions: ["docx", "txt", "csv", "md", "json"],
  },
  { name: "Word Documents", extensions: ["docx"] },
  { name: "Text Documents", extensions: ["txt", "csv", "md", "json"] },
  { name: "All Files", extensions: ["*"] },
];

const debounce = (fn: () => void, ms: number) => {
  let timeout: NodeJS.Timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(fn, ms);
  };
};

type ChatboxProps = {
  busy: boolean;
  show: boolean;
  chatboxRef: React.RefObject<HTMLTextAreaElement>;
  onSubmit: (message: string) => Promise<void>;
};
export const Chatbox = ({ busy, show, chatboxRef, onSubmit }: ChatboxProps) => {
  const isReadyForDrop = useContext(DropReadyContext);
  const [textInputValue, setTextInputValue] = useState("");
  const [focus, setFocus] = useState(false);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);

  const fixHeight = debounce(() => {
    const $target = chatboxRef.current;
    if (!$target || $target?.value === "") {
      setHeight(DEFAULT_HEIGHT);
      return;
    }
    const windowHeight = window.innerHeight;
    const idealHeight = Math.min($target.scrollHeight, windowHeight / 2);
    setHeight(idealHeight + "px");
  }, 100);

  useEffect(fixHeight, [textInputValue]);

  const submitTextInputHandler = async () => {
    const trimmed = textInputValue.trim();
    setTextInputValue("");
    await onSubmit(trimmed);
  };

  return (
    <div
      className="w-full p-5 flex flex-row items-center space-x-2"
      style={{
        transition: "box-shadow 100ms, transform 150ms",
        position: "absolute",
        bottom: 0,
        right: 0,
        left: 0,
        transform: show ? "translateY(0)" : "translateY(150%)",
      }}
    >
      <div
        className={
          "relative flex-grow flex items-center bg-slate-100 z-10 " +
          (focus ? "shadow-lg" : "shadow-2xl")
        }
      >
        <textarea
          className="flex-grow pl-6 pr-12 py-4 border-0 bg-white rounded-lg focus:ring-2 focus:ring-blue-600"
          style={{
            height,
            outline: "none",
          }}
          placeholder="Type a message..."
          value={textInputValue}
          onChange={(e) => setTextInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitTextInputHandler();
            }
          }}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />
        <button
          type="button"
          className="absolute right-0 m-2 flex items-center justify-center w-10 h-10 rounded-lg text-slate-300 hover:bg-blue-100 hover:text-blue-600 active:scale-95"
          onClick={submitTextInputHandler}
          disabled={busy}
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </div>
      <div>
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-200 hover:text-slate-600 active:scale-95"
          style={{
            transition: "width 150ms, transform 150ms, opacity 150ms",
            ...(isReadyForDrop
              ? {
                  transform: "scale(1)",
                  opacity: "1",
                  pointerEvents: "auto",
                }
              : {
                  width: "0px",
                  transform: "scale(0.8)",
                  opacity: "0",
                  pointerEvents: "none",
                }),
          }}
          onClick={async () => {
            const file = await open({
              multiple: false,
              directory: false,
              filters: FILE_ATTACHMENT_FILTERS,
            });
            if (file) {
              const doc = await readDocument(file);
              const message = getAttachmentTemplate(file, doc);
              onSubmit(message);
            }
          }}
          disabled={busy}
        >
          <PaperclipIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
