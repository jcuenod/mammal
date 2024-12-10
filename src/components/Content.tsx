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
import { messageIsAttachment } from "../util/attach";

const getParentId = (treeId: string) =>
  treeId.split(".").slice(0, -1).join(".");

export const Content = () => {
  // const { data, state, error } = useContext<MessageStoreContext>(M3Context);
  const { data } = useContext<MessageStoreContext>(MessageContext);
  const { temperature, maxTokens } = useContext(ModelSettingsContext);

  const { getThreadEndingAt: getThreadToId } =
    useContext<MessageStoreContext>(MessageContext);

  const {
    messageThread: thread,
    addMessage,
    threadOpId,
    activeMessage,
    setActiveMessage,
    removeMessageAndDescendants,
  } = data;
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatboxRef = useRef<HTMLTextAreaElement>(null);
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

  const generateMessageAndAttachToParent: (
    provider: { apiKey: string; endpoint: string; name: string },
    model: { model: string; name: string },
    messages: { role: string; content: string }[],
    parentId: string,
    callback?: (content: string) => void
  ) => Promise<string> = async (
    provider: { apiKey: string; endpoint: string; name: string },
    model: { model: string; name: string },
    messages: { role: string; content: string }[],
    parentId: string,
    callback?: (content: string) => void
  ) =>
    new Promise((resolve, reject) => {
      const author = `${provider.name} (${model.name})`;
      setBusy(true);

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
          const newId = await addMessage({
            data: {
              name: author,
              role: "assistant",
              message: content,
              createdAt: new Date().toISOString(),
              metadata: {
                provider: provider.name,
                model: model.model,
                temperature,
              },
            },
            parentId,
          });
          if (!newId) {
            reject("Failed to add message");
          } else {
            resolve(newId);
          }
          // We use a timeout so that the added message has time to enter the context (awaiting only awaits till the message is in the db)
          setTimeout(() => {
            setLastMessage(null);
            setBusy(false);
            callback?.(content);
          }, 100);
        }
      );
    });

  const generateChildFor: (treeId: string) => Promise<string> = async (
    treeId: string
  ) => {
    // get message list (as { content, role }) from treebeard using newId
    const newThread = await getThreadToId(treeId);
    const messageMap = newThread.map(({ role, message }) => ({
      content: message,
      role,
    }));

    const providerAndModel = await getProviderAndModel(
      selectedProviderId,
      selectedModelId
    );
    if (!providerAndModel) {
      throw new Error("Provider and model not found");
    }

    const { provider, model } = providerAndModel;
    return await generateMessageAndAttachToParent(
      provider,
      model,
      messageMap,
      treeId
    );
  };

  const addMessageToParent = async ({
    name,
    role,
    message,
    parentId,
  }: {
    name: string;
    role: ChatMessageRole;
    message: string;
    parentId: string | undefined;
  }) => {
    const newId = await addMessage({
      data: {
        name,
        role,
        message,
        createdAt: new Date().toISOString(),
      },
      parentId,
    });
    if (!newId) {
      throw new Error("Failed to add message");
    }

    // if role is "user", we want to generate a new assistant message
    if (role === "user" && !messageIsAttachment(message)) {
      return await generateChildFor(newId);
    }
    return newId;
  };

  const onUserAppend = async (message: string | string[]) => {
    const m = messages;
    let parentId = m[m.length - 1]?.treeId || undefined;
    const messagesAsArray = Array.isArray(message) ? message : [message];
    for (const m of messagesAsArray) {
      parentId =
        (await addMessageToParent({
          name: "User",
          role: "user",
          message: m,
          parentId,
        })) || undefined;
    }
  };

  // Editing could happen anywhere in the thread
  const onEditMessage = (treeId: string, message: string) => {
    const parentId = getParentId(treeId);
    const messageToBeEdited = messages.find((m) => m.treeId === treeId);

    if (!messageToBeEdited) {
      console.error("Message not found");
      return;
    }

    addMessageToParent({
      name: messageToBeEdited.name,
      role: messageToBeEdited.role,
      message,
      parentId,
    });
  };

  const onDeleteMessage = async (treeId: string) => {
    const sure = await window.confirm(
      "Are you sure you want to delete this message?"
    );
    if (!sure) {
      return;
    }
    removeMessageAndDescendants(treeId);
  };

  return (
    <div className="flex flex-col relative flex-grow h-full overflow-hidden bg-slate-100">
      <Navbar
        selectedProviderId={selectedProviderId}
        selectedModelId={selectedModelId}
        selectProvider={selectProvider}
        selectModel={selectModel}
      />
      {/* chat box at the bottom */}
      <Chatbox
        busy={busy}
        show={!isEditing}
        chatboxRef={chatboxRef}
        onSubmit={onUserAppend}
      />
      <div className="flex flex-col-reverse overflow-y-scroll" ref={scrollRef}>
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
          {/* spacer for when there are too few messages to fill the screen */}
          <div className="flex-grow" />
        </div>
      </div>
      <EditMessageDialog
        show={isEditing !== null}
        message={messages.find((m) => m.treeId === isEditing)?.message || ""}
        onEditMessage={(message) => {
          if (isEditing === null) {
            return;
          }
          onEditMessage(isEditing, message);
          setIsEditing(null);
        }}
        onCancel={() => setIsEditing(null)}
      />
    </div>
  );
};
