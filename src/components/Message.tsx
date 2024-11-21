import { useEffect, useState } from "react";
import { ChatMessageRole } from "../state/messageContext";
import MPTreeNode from "../treebeard/src/MPTreeNode";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  EditIcon,
  UserIcon,
  AssistantIcon,
  LeftChevronIcon,
  RefreshIcon,
  RightChevronIcon,
} from "./Icons";

type GhostButtonProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  disabled?: boolean;
  onClick?: () => void;
};
const GhostButton = ({
  children,
  style,
  disabled,
  onClick,
}: GhostButtonProps) => (
  <button
    type="button"
    className="flex justify-center items-center p-1 w-6 h-6 text-slate-600 cursor-pointer disabled:hover:bg-transparent hover:bg-slate-200 hover:text-slate-700 disabled:text-slate-300 rounded active:scale-95 active:bg-slate-300 "
    style={{ pointerEvents: disabled ? "none" : "auto", ...style }}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

const DirectionButton = ({
  direction,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) => {
  return (
    <GhostButton onClick={onClick} disabled={disabled}>
      {direction === "left" ? (
        <LeftChevronIcon className="w-6 h-6" />
      ) : (
        <RightChevronIcon className="w-6 h-6" />
      )}
    </GhostButton>
  );
};

type UserButtonsProps = {
  leftSibling?: string;
  rightSibling?: string;
  onEdit: () => void;
  setActiveMessage: (treeId: string) => void;
};
const UserButtons = ({
  leftSibling,
  rightSibling,
  onEdit,
  setActiveMessage,
}: UserButtonsProps) => (
  <>
    {leftSibling || rightSibling ? (
      <>
        <DirectionButton
          disabled={!leftSibling}
          onClick={() => {
            if (leftSibling) {
              setActiveMessage(leftSibling);
            }
          }}
          direction="left"
        />
        <DirectionButton
          disabled={!rightSibling}
          onClick={() => {
            if (rightSibling) {
              setActiveMessage(rightSibling);
            }
          }}
          direction="right"
        />
      </>
    ) : null}
    {/* edit button */}
    <GhostButton onClick={onEdit}>
      <EditIcon className="w-8 h-8" />
    </GhostButton>
  </>
);

type AssistantButtonsProps = {
  leftSibling?: string;
  rightSibling?: string;
  busy: boolean;
  onEdit: () => void;
  onRegenerate?: () => void;
  setActiveMessage: (treeId: string) => void;
};
const AssistantButtons = ({
  leftSibling,
  rightSibling,
  busy,
  onEdit,
  onRegenerate,
  setActiveMessage,
}: AssistantButtonsProps) => (
  <>
    {leftSibling || rightSibling ? (
      <>
        <DirectionButton
          disabled={!leftSibling}
          onClick={() => {
            if (leftSibling) {
              setActiveMessage(leftSibling);
            }
          }}
          direction="left"
        />
        <DirectionButton
          disabled={!rightSibling}
          onClick={() => {
            if (rightSibling) {
              setActiveMessage(rightSibling);
            }
          }}
          direction="right"
        />
      </>
    ) : null}
    {/* edit button */}
    <GhostButton onClick={onEdit}>
      <EditIcon className="w-8 h-8" />
    </GhostButton>
    {/* regenerate button */}
    <GhostButton
      style={{
        transformOrigin: "center",
        animation: busy ? "spin 1s linear infinite" : "none",
      }}
      disabled={busy}
      onClick={() => {
        if (onRegenerate) {
          onRegenerate();
        } else {
          console.error("onRegenerate not defined");
        }
      }}
    >
      <RefreshIcon className="w-8 h-8" />
    </GhostButton>
  </>
);

type MessageProps = {
  treeId: string;
  getSiblings: (s: boolean) => Promise<MPTreeNode[]>;
  name: string;
  role: ChatMessageRole;
  busy: boolean;
  markdown: string;
  activeMessage: string | null;
  onEdit: () => void;
  onRegenerate?: (callback?: (content: string) => void) => void;
  setActiveMessage: (treeId: string) => void;
};
export const Message = ({
  treeId,
  getSiblings,
  name,
  markdown,
  role,
  busy,
  activeMessage,
  onEdit,
  onRegenerate,
  setActiveMessage,
}: MessageProps) => {
  const [siblings, setSiblings] = useState<MPTreeNode[]>([]);
  useEffect(() => {
    getSiblings(true).then(setSiblings);
  }, [treeId]);

  const currentIndex = siblings.findIndex((s) => s.path === treeId);
  const leftSiblings = siblings.slice(0, currentIndex).reverse();
  const rightSiblings = siblings.slice(currentIndex + 1);
  const leftSibling =
    leftSiblings.length > 0 ? leftSiblings[0].path : undefined;
  const rightSibling =
    rightSiblings.length > 0 ? rightSiblings[0].path : undefined;

  return (
    <div
      className={
        "flex w-full p-6 mb-2 bg-white rounded-lg shadow-sm"
        // + (activeMessage === treeId ? " border-2 border-slate-400" : " border-2 border-white")
      }
    >
      {/* <img className="w-10 h-10 rounded-full" src={avatar} alt={name} /> */}
      <div className="w-10 h-10 min-w-10 rounded-full bg-blue-100 text-slate-700 flex items-center justify-center">
        {role === "user" ? (
          <UserIcon className="w-7 h-7" />
        ) : (
          <AssistantIcon className="w-7 h-7" />
        )}
      </div>
      <div className="flex flex-col ml-4 markdown-body w-full">
        {/* space between flex items in row */}
        <div className="flex flex-row justify-between items-center mb-1">
          <span className="font-bold text-slate-700 text-ellipsis overflow-hidden whitespace-nowrap">
            {name}
          </span>
          <div className="flex flex-row justify-center items-center">
            {role === "assistant" && (
              <AssistantButtons
                leftSibling={leftSibling}
                rightSibling={rightSibling}
                busy={busy}
                onEdit={onEdit}
                onRegenerate={onRegenerate}
                setActiveMessage={setActiveMessage}
              />
            )}
            {role === "user" && (
              <UserButtons
                leftSibling={leftSibling}
                rightSibling={rightSibling}
                onEdit={onEdit}
                setActiveMessage={setActiveMessage}
              />
            )}
          </div>
        </div>
        <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
      </div>
    </div>
  );
};