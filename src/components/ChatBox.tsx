import { useContext, useEffect, useState } from "react";
import { PaperclipIcon, SendIcon } from "./Icons";
import { open } from "@tauri-apps/plugin-dialog";
import { getAttachmentTemplate, readDocument } from "../util/attach";
import { DropReadyContext } from "../state/dropReadyContextProvider";

// Setup CSS Variable: --scrollbar-width
let scrollbarWidth = 0;
const scrollDiv = document.createElement("div");
scrollDiv.style.position = "absolute";
scrollDiv.style.left = "-9999px";
scrollDiv.style.width = "100px";
scrollDiv.style.height = "100px";
scrollDiv.style.overflow = "scroll";

document.body.appendChild(scrollDiv);
scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
document.body.removeChild(scrollDiv);

document.documentElement.style.setProperty(
  "--scrollbar-width",
  scrollbarWidth + "px"
);

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

type AttachButtonProps = {
  busy: boolean;
  isReadyForDrop: boolean;
  onSubmit: (message: string) => void;
};
const AttachButton = ({
  busy,
  isReadyForDrop,
  onSubmit,
}: AttachButtonProps) => (
  <div className="w-10 h-10 flex items-center justify-center">
    <button
      type="button"
      className="text-slate-300 hover:text-slate-600 active:scale-90 active-text-slate-800"
      style={{
        transition: "transform 120ms, opacity 120ms",
        ...(isReadyForDrop
          ? {
              // can't include `scale` here because it will override the `active:scale-90` class
              opacity: "1",
              pointerEvents: "auto",
            }
          : {
              transform: "scale(0.4)",
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
);

type SendButtonProps = {
  busy: boolean;
  submitTextInputHandler: () => void;
};
const SendButton = ({ busy, submitTextInputHandler }: SendButtonProps) => (
  <button
    type="button"
    className="flex items-center justify-center w-10 h-10 rounded-lg text-slate-300 hover:bg-slate-100 hover:text-blue-600 active:scale-95"
    onClick={submitTextInputHandler}
    disabled={busy}
  >
    <SendIcon className="w-6 h-6" />
  </button>
);

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
      className="p-4 flex flex-row items-center space-x-2"
      style={{
        transition: "box-shadow 100ms, transform 150ms",
        position: "absolute",
        bottom: 0,
        right: "var(--scrollbar-width)",
        left: 0,
        transform: show ? "translateY(0)" : "translateY(150%)",
      }}
    >
      <div
        className={
          "relative flex-grow flex items-center bg-transparent z-10 " +
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
          ref={chatboxRef}
        />
        <div className="absolute right-0 m-2 flex flex-row">
          <AttachButton
            busy={busy}
            isReadyForDrop={isReadyForDrop}
            onSubmit={onSubmit}
          />
          <SendButton
            busy={busy}
            submitTextInputHandler={submitTextInputHandler}
          />
        </div>
      </div>
    </div>
  );
};
