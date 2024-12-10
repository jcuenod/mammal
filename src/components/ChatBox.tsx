import { useEffect, useState } from "react";
import { PaperclipIcon, SendIcon } from "./Icons";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

const DEFAULT_HEIGHT = "3.5em";

const debounce = (fn: () => void, ms: number) => {
  let timeout: NodeJS.Timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(fn, ms);
  };
};

const getAttachmentTemplate = (filename: string, content: string) => `
<FILE_ATTACHMENT>
<FILE_NAME>
${filename}
</FILE_NAME>
<FILE_CONTENT>
${content}
</FILE_CONTENT>
</FILE_ATTACHMENT>
`;

const readDocument = async (path: string) =>
  await invoke<string>("read_document", { path });

type ChatboxProps = {
  busy: boolean;
  show: boolean;
  chatboxRef: React.RefObject<HTMLTextAreaElement>;
  onSubmit: (message: string) => void;
  onAttach: (message: string) => void;
};
export const Chatbox = ({
  busy,
  show,
  chatboxRef,
  onSubmit,
  onAttach,
}: ChatboxProps) => {
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

  const submitTextInputHandler = () => {
    onSubmit(textInputValue);
    setTextInputValue("");
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
          onClick={async () => {
            const file = await open({
              multiple: false,
              directory: false,
              filters: [
                { name: "Documents (.doc[x])", extensions: ["docx", "doc"] },
                // { name: "All Files", extensions: ["*"] },
              ],
            });
            if (file) {
              const doc = await readDocument(file);
              const message = getAttachmentTemplate(file, doc);
              onAttach(message);
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
