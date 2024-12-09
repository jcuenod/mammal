import { getCurrentWebview } from "@tauri-apps/api/webview";
import { Event } from "@tauri-apps/api/event";
import { PhysicalPosition } from "@tauri-apps/api/dpi";
import { getAttachmentTemplate, readDocument } from "../util/attach";
import { useContext, useState } from "react";
import { PaperclipIcon } from "./Icons";
import { MessageContext, MessageStoreContext } from "../state/messageContext";
import { DropReadyContext } from "../state/dropReadyContextProvider";

type DropEvent = {
  type: "drop";
  paths: string[];
  position: PhysicalPosition;
};

// We abuse the dropHandler object to pass setIsDragging to the onDrop handler
// There doesn't seem to be another way to manage the unlistening issue
const dropHandler = {
  setIsDragging: (_isDragging: boolean) => {},
  onDrop: (_event: Event<DropEvent>) => {},
};

getCurrentWebview().onDragDropEvent(async (event) => {
  switch (event.payload.type) {
    case "enter":
    case "over":
      dropHandler.setIsDragging(true);
      break;
    case "leave":
      dropHandler.setIsDragging(false);
      break;
    case "drop":
      dropHandler.onDrop(event as Event<DropEvent>);
      dropHandler.setIsDragging(false);
      break;
  }
});

export const DropHandler = () => {
  const isReadyForDrop = useContext(DropReadyContext);
  const { data } = useContext<MessageStoreContext>(MessageContext);
  const [isDragging, setIsDragging] = useState(false);
  const { messageThread } = data;
  const { addMessage } = data;

  if (!isReadyForDrop) {
    dropHandler.setIsDragging = () => {
      console.log("Not ready for drop!");
    };
    dropHandler.onDrop = () => {
      console.log("Not ready for drop!");
    };
  } else {
    dropHandler.setIsDragging = setIsDragging;
    dropHandler.onDrop = async (event) => {
      let parentId: string | undefined =
        messageThread[messageThread.length - 1]?.treeId || undefined;
      for (const file of event.payload.paths) {
        const doc = await readDocument(file);
        const message = getAttachmentTemplate(file, doc);
        parentId =
          (await addMessage({
            data: {
              role: "user",
              name: "User",
              message,
              createdAt: new Date().toISOString(),
            },
            parentId,
          })) || undefined;
      }
    };
  }

  // overlay that covers the whole screen
  // box with thick dashed line and big border radius
  // centered text in the middle that says "Drop files here"
  return (
    <div
      className="fixed top-0 left-0 w-screen h-screen p-10 bg-gray-500 bg-opacity-50 flex items-center justify-center"
      style={{
        opacity: isDragging ? 1 : 0,
        pointerEvents: isDragging ? "auto" : "none",
        transition: "opacity 100ms",
        cursor: isReadyForDrop ? "copy" : "not-allowed",
      }}
    >
      <div className="w-full h-full rounded-3xl border-4 border-dashed border-gray-100 flex flex-row items-center justify-center">
        <PaperclipIcon className="w-12 h-12 text-white" />
        <p className="ml-4 text-4xl text-white font-semibold">
          {isReadyForDrop ? "Attach Files" : "Not Ready"}
        </p>
      </div>
    </div>
  );
};
