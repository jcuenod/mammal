import {
  ChatMessageRole,
  MessageContext,
  MessageStoreContext,
  MessageThread,
} from "../state/messageContext";
import { getResponse } from "../llm";
import { useState, useRef, useEffect, useContext } from "react";
import { Navbar } from "./Navbar";
import "./Content.css";
import { getAll } from "../state/modelProviders";
import { ModelSettingsContext } from "../state/modelSettingsContext";
import { Chatbox } from "./ChatBox";
import { Message } from "./Message";
import { EditMessageDialog } from "./EditMessageDialog";

const getParentId = (treeId: string) =>
  treeId.split(".").slice(0, -1).join(".");

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
  const [isEditing, setIsEditing] = useState<string | null>(null);
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
    setIsEditing(null);
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
          show={!isEditing}
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
                setIsEditing(m.treeId);
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
      <EditMessageDialog
        show={isEditing !== null}
        message={messages.find((m) => m.treeId === isEditing)?.message || ""}
        onEditMessage={(message) => {
          // setBusy(true);
          // const parentId = getParentId(isEditing);
          // onRegenerate(parentId, (content) => {
          //   setBusy(false);
          //   setIsEditing(null);
          // });
          console.log("Edit message", message);
          setIsEditing(null);
        }}
        onCancel={() => setIsEditing(null)}
      />
    </div>
  );
};
