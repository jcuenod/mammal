import { useEffect, useRef } from "react";
import { MailCheckIcon } from "./Icons";

type EditMessageDialogProps = {
  show: boolean;
  message: string;
  onEditMessage: (message: string) => void;
  onCancel: () => void;
};
export const EditMessageDialog = ({
  show,
  message,
  onEditMessage,
  onCancel,
}: EditMessageDialogProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const $textarea = textareaRef.current;
    if (!$textarea) return;
    $textarea.value = message;
    $textarea.style.height = "0px";
    $textarea.focus();
    requestAnimationFrame(() => {
      $textarea.style.height = $textarea.scrollHeight + "px";
    });
  }, [show, message]);

  return (
    <div
      className="absolute top-0 left-0 bottom-0 right-0"
      style={{
        opacity: show ? 1 : 0,
        pointerEvents: show ? "auto" : "none",
        transition: "opacity 300ms",
        backgroundColor: "rgba(250,250,250,0.8)",
        backdropFilter: "blur(5px)",
      }}
    >
      <div
        className={
          "w-full h-full p-10 flex flex-col justify-center items-center transition-transform " +
          (show ? "scale-100" : "scale-95")
        }
      >
        <textarea
          ref={textareaRef}
          className="p-4 w-full m-4 rounded-lg focus:ring-2 focus:ring-blue-600 shadow"
          style={{ outline: "none", minHeight: "10rem", maxHeight: "80%" }}
        ></textarea>
        <div className="flex flex-row w-full justify-end space-x-2">
          {/* save */}
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded flex items-center space-x-2 hover:bg-blue-600 active:bg-blue-700 active:scale-95"
            onClick={() => {
              const text = textareaRef.current?.value.trim() || "";
              if (text === "") {
                onCancel();
              }
              onEditMessage(text);
            }}
          >
            <MailCheckIcon className="w-6 h-6" />
            <span>Save</span>
          </button>
          {/* cancel */}
          <button
            className="px-4 py-2 bg-slate-200 rounded text-slate-700 hover:bg-slate-300 active:bg-slate-400 active:scale-95"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
