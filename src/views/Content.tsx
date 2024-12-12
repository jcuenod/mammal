import { useState, useRef, useEffect, useContext } from "react";
import {
  ChatMessageRole,
  MessageContext,
  MessageStoreContext,
  MessageThread,
} from "../state/messageContext";
import { getAncestorsOf, getParentId } from "../treebeard/src/treeUtils";
import { SecondarySidebar } from "../components/SecondarySidebar";
import { Navbar } from "../components/Navbar";
import { getResponse } from "../llm";
import { getAll } from "../state/modelProviders";
import { ModelSettingsContext } from "../state/modelSettingsContext";
import { Chatbox } from "../components/ChatBox";
import { EditMessageDialog } from "../components/EditMessageDialog";
import { messageIsAttachment } from "../util/attach";

import "./Content.css";
import "@shoelace-style/shoelace/dist/themes/light.css";
import SlSplitPanel from "@shoelace-style/shoelace/dist/react/split-panel/index.js";
import { MessageThreadView } from "../components/MessageThreadView";

const debounce = (fn: (...args: any[]) => void, ms: number) => {
  let timeout: number;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => fn(...args), ms);
  };
};

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
  const messages = lastMessage
    ? [...getAncestorsOf(lastMessage.treeId, thread), lastMessage]
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
      const tempTreeId = parentId ? `${parentId}.99999` : "99999.1";
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
            treeId: tempTreeId,
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
            treeId: tempTreeId,
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

  const onSubmitEditMessage = (treeId: string, message: string) => {
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [positionInPixels, setPositionInPixels] = useState(250);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <SlSplitPanel
      style={{
        // @ts-ignore
        "--divider-width": "2px",
        "--divider-hit-area": "20px",
        width: "100%",
        cursor: "col-resize",
        overflow: "hidden",
      }}
      snap={"0"}
      snapThreshold={180}
      positionInPixels={isSidebarOpen ? positionInPixels : 0}
      onSlReposition={debounce((e) => {
        // @ts-ignore (trust me, it does exist)
        const { positionInPixels } = e.target;
        if (positionInPixels === 0) {
          setIsSidebarOpen(false);
        } else if (positionInPixels > 0) {
          setIsSidebarOpen(true);
          setPositionInPixels(positionInPixels);
        }
      }, 100)}
      onDoubleClick={toggleSidebar}
    >
      <div slot="start" className="h-full overflow-hidden">
        <SecondarySidebar />
      </div>
      <div slot="divider">
        {/* unicode three vertical dots */}
        &#8942;
      </div>
      <div
        className="flex flex-col relative flex-grow h-full overflow-hidden bg-slate-100"
        slot="end"
      >
        <Navbar
          selectedProviderId={selectedProviderId}
          selectedModelId={selectedModelId}
          selectProvider={selectProvider}
          selectModel={selectModel}
          toggleSidebar={toggleSidebar}
          sidebarOpen={isSidebarOpen}
        />
        {/* chat box at the bottom */}
        <Chatbox
          busy={busy}
          show={!isEditing}
          chatboxRef={chatboxRef}
          onSubmit={onUserAppend}
        />
        <MessageThreadView
          busy={busy}
          activeMessage={activeMessage}
          setActiveMessage={setActiveMessage}
          setIsEditing={setIsEditing}
          onDeleteMessage={onDeleteMessage}
          generateChildFor={generateChildFor}
          messages={messages}
          ref={scrollRef}
        />
        <EditMessageDialog
          show={isEditing !== null}
          message={messages.find((m) => m.treeId === isEditing)?.message || ""}
          onEditMessage={(message) => {
            if (isEditing === null) {
              return;
            }
            onSubmitEditMessage(isEditing, message);
            setIsEditing(null);
          }}
          onCancel={() => setIsEditing(null)}
        />
      </div>
    </SlSplitPanel>
  );
};
