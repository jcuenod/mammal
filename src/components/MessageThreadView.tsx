import { forwardRef } from "react";
import { ChatMessageRole, MessageThread } from "../state/messageContext";
import { Message } from "../components/Message";
import { getParentId } from "../treebeard/src/treeUtils";

type MessageThreadViewProps = {
  busy: boolean;
  activeMessage: string | null;
  setActiveMessage: (treeId: string) => void;
  setIsEditing: (treeId: string | null) => void;
  onDeleteMessage: (treeId: string) => void;
  generateChildFor: (treeId: string) => Promise<string>;
  messages: MessageThread[];
};
export const MessageThreadView = forwardRef(
  (
    {
      busy,
      activeMessage,
      setActiveMessage,
      setIsEditing,
      onDeleteMessage,
      generateChildFor,
      messages,
    }: MessageThreadViewProps,
    scrollRef: React.ForwardedRef<HTMLDivElement>
  ) => {
    return (
      <div
        className="flex-grow flex flex-col-reverse overflow-y-scroll"
        ref={scrollRef}
      >
        {/* spacer for when there are too few messages to fill the screen */}
        <div className="flex-grow" />
        {/* message thread (col-reverse) intuitively keeps scrollbar at the bottom */}
        <div className="flex flex-col p-6 mb-16">
          {/* messages */}
          {[...messages].map((m) => (
            <Message
              key={m.treeId}
              treeId={m.treeId}
              // TODO: hacky test for message level busy state
              busy={busy && m.treeId.includes("99999")}
              getSiblings={m.getSiblings}
              name={m.name}
              role={m.role as ChatMessageRole}
              markdown={m.message}
              activeMessage={activeMessage}
              setActiveMessage={(treeId) => setActiveMessage(treeId)}
              onEdit={() => setIsEditing(m.treeId)}
              onDelete={() => onDeleteMessage(m.treeId)}
              onRegenerate={() => {
                if (m.role === "assistant") {
                  generateChildFor(getParentId(m.treeId));
                } else {
                  console.error(
                    "onRegenerate not defined for user/system messages"
                  );
                }
              }}
            />
          ))}
        </div>
      </div>
    );
  }
);
