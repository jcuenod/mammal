import {
  ChatMessageRole,
  MessageContext,
  MessageStoreContext,
  MessageThread,
} from "../state/messageContext";
import { getResponse } from "../llm";
import { useState, useRef, useEffect, useContext } from "react";
import { Navbar } from "./Navbar";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./Content.css";
import { getAll } from "../state/modelProviders";
import {
  EditIcon,
  LeftChevronIcon,
  RefreshIcon,
  RightChevronIcon,
} from "./Icons";
import { UserIcon, AssistantIcon } from "./Icons";
import MPTreeNode from "../treebeard/src/MPTreeNode";
import { ModelSettingsContext } from "../state/modelSettingsContext";
import { Chatbox } from "./ChatBox";

const getParentId = (treeId: string) =>
  treeId.split(".").slice(0, -1).join(".");

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
    className="flex justify-center items-center p-1 w-6 h-6 text-slate-600 cursor-pointer disabled:hover:bg-transparent hover:bg-slate-200 hover:text-slate-700 disabled:text-slate-300 rounded active:scale-95 "
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
    {/* regenerate button */}
    {/* <GhostButton onClick={onEdit}>
      <EditIcon className="w-8 h-8" />
    </GhostButton> */}
  </>
);

type AssistantButtonsProps = {
  leftSibling?: string;
  rightSibling?: string;
  busy: boolean;
  onRegenerate?: () => void;
  setActiveMessage: (treeId: string) => void;
};
const AssistantButtons = ({
  leftSibling,
  rightSibling,
  busy,
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
const Message = ({
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
          <span className="font-bold text-slate-700">{name}</span>
          <div className="flex flex-row justify-center items-center">
            {role === "assistant" && (
              <AssistantButtons
                leftSibling={leftSibling}
                rightSibling={rightSibling}
                busy={busy}
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

export const Content = () => {
  // const { data, state, error } = useContext<MessageStoreContext>(M3Context);
  const { data } = useContext<MessageStoreContext>(MessageContext);
  const { temperature, maxTokens } = useContext(ModelSettingsContext);

  const {
    messageThread: thread,
    addMessage,
    threadOpId,
    activeMessage,
    setActiveMessage,
  } = data;
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatboxRef = useRef<HTMLTextAreaElement>(null);
  const [textInputValue, setTextInputValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedProviderId, selectProvider] = useState<number>(0);
  const [selectedModelId, selectModel] = useState<number>(0);
  const [lastMessage, setLastMessage] = useState<MessageThread | null>(null);
  const islastMessageInThread = thread.find(
    (m) => m.message === lastMessage?.message
  );
  const messages = lastMessage
    ? !islastMessageInThread
      ? [...thread, lastMessage]
      : [...thread]
    : [...thread];

  useEffect(() => {
    chatboxRef.current?.focus();
  }, [threadOpId]);

  const getProviderAndModel = async (
    selectedProviderId: number,
    selectedModelId: number
  ) => {
    const providers = await getAll();
    const provider = providers.find((p) => p.id === selectedProviderId);
    if (!provider) {
      setBusy(false);
      console.error("Provider not found");
      return;
    }
    const model = provider.models.find((m) => m.id === selectedModelId);
    if (!model) {
      setBusy(false);
      console.error("Model not found");
      return;
    }

    return { provider, model };
  };

  const generateMessageAndAttachToParent = async (
    provider: { apiKey: string; endpoint: string; name: string },
    model: { model: string; name: string },
    messages: { role: string; content: string }[],
    parentId: string,
    callback?: (content: string) => void
  ) => {
    const author = `${provider.name} (${model.name})`;

    getResponse(
      provider.apiKey,
      provider.endpoint,
      model.model,
      temperature,
      maxTokens,
      messages,
      (responseSnapshot) => {
        setLastMessage({
          treeId: "irrelevant",
          role: "assistant",
          name: author,
          createdAt: new Date().toISOString(),
          message: responseSnapshot,
          metadata: JSON.stringify({
            provider: provider.name,
            model: model.model,
            temperature,
          }),
          getSiblings: () => Promise.resolve([]),
        });
      },
      async (content) => {
        setLastMessage({
          treeId: "irrelevant",
          role: "assistant",
          name: author,
          createdAt: new Date().toISOString(),
          message: content,
          metadata: JSON.stringify({
            provider: provider.name,
            model: model.model,
            temperature,
          }),
          getSiblings: () => Promise.resolve([]),
        });
        // const _evenNewerId =
        await addMessage({
          data: {
            name: author,
            role: "assistant",
            message: content,
            metadata: {
              provider: provider.name,
              model: model.model,
              temperature,
            },
          },
          parentId,
        });
        // We use a timeout so that the added message has time to enter the context (awaiting only awaits till the message is in the db)
        setTimeout(() => {
          setLastMessage(null);
          setBusy(false);
          callback?.(content);
        }, 100);
      }
    );
  };

  const onSubmit = async () => {
    setBusy(true);

    const userPrompt = textInputValue;
    setTextInputValue("");

    const newId = await addMessage({
      data: {
        name: "User",
        role: "user",
        message: userPrompt,
      },
      parentId: messages[messages.length - 1]?.treeId,
    });
    if (!newId) {
      console.error("Failed to add message");
      return;
    }

    const messageMap = [
      ...messages.map(({ role, message }) => ({
        content: message,
        role,
      })),
      {
        content: userPrompt,
        role: "user",
      },
    ];

    const providerAndModel = await getProviderAndModel(
      selectedProviderId,
      selectedModelId
    );
    if (!providerAndModel) {
      return;
    }
    const { provider, model } = providerAndModel;

    generateMessageAndAttachToParent(provider, model, messageMap, newId);
  };

  const onRegenerate = async (
    parentId: string,
    callback?: (content: string) => void
  ) => {
    setBusy(true);

    const providerAndModel = await getProviderAndModel(
      selectedProviderId,
      selectedModelId
    );
    if (!providerAndModel) {
      return;
    }
    const { provider, model } = providerAndModel;

    const mappedMessages = messages
      .slice(0, messages.findIndex((m) => m.treeId === parentId) + 1)
      .map(({ role, message }) => ({
        content: message,
        role,
      }));

    generateMessageAndAttachToParent(
      provider,
      model,
      mappedMessages,
      parentId,
      callback
    );
  };

  return (
    <div className="flex flex-col relative flex-grow h-full bg-slate-100">
      <Navbar
        selectedProviderId={selectedProviderId}
        selectedModelId={selectedModelId}
        selectProvider={selectProvider}
        selectModel={selectModel}
      />
      <div className="flex flex-col-reverse overflow-auto" ref={scrollRef}>
        {/* chat box at the bottom */}
        <Chatbox
          busy={busy}
          textInputValue={textInputValue}
          setTextInputValue={setTextInputValue}
          onSubmit={onSubmit}
          chatboxRef={chatboxRef}
        />

        {/* message thread (col-reverse) intuitively keeps scrollbar at the bottom */}
        <div className="flex flex-col p-6 mb-16">
          {/* messages */}
          {[...messages].map((m) => (
            <Message
              key={m.treeId}
              treeId={m.treeId}
              busy={busy}
              getSiblings={m.getSiblings}
              name={m.name}
              role={m.role as ChatMessageRole}
              markdown={m.message}
              activeMessage={activeMessage}
              setActiveMessage={(treeId) => setActiveMessage(treeId)}
              onEdit={() => {
                console.error("onEdit not defined");
              }}
              onRegenerate={() => {
                if (m.role === "assistant") {
                  onRegenerate(getParentId(m.treeId));
                } else {
                  console.error(
                    "onRegenerate not defined for user/system messages"
                  );
                }
              }}
            />
          ))}
          {/* spacer for when there are too few messages to fill the screen */}
          <div className="flex-grow" />
        </div>
      </div>
    </div>
  );
};
