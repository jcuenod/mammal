import { useMessageStore, addMessage } from "../state/messages";
import type { ChatMessage, ChatMessageRole } from "../state/messages";
import OpenAI from "openai";
import { useState, useRef, useEffect } from "react";
import { Navbar } from "./Navbar";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./Content.css";
import { getAll } from "../state/modelProviders";

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-7 h-7"
  >
    <circle cx="12" cy="8" r="5" />
    <path d="M20 21a8 8 0 0 0-16 0" />
  </svg>
);
const AssistantIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-7 h-7"
  >
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);
const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-6 h-6"
  >
    <path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" />
    <path d="M6 12h16" />
  </svg>
);

const getResponse = async (
  apiKey: string,
  baseURL: string,
  model: string,
  messages: { role: string; content: string }[],
  updateResponseCallback: (responseSnapshot: string) => void,
  onDone: (finalResponse: string) => void
) => {
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
    dangerouslyAllowBrowser: true,
  });

  const stream = client.beta.chat.completions.stream({
    // @ts-ignore
    messages,
    model,
    stream: true,
  });

  stream.on("content", (_delta, snapshot) => {
    updateResponseCallback(snapshot);
  });

  stream.on("content.done", ({ content }) => {
    onDone(content);
  });
};

type MessageProps = {
  name: string;
  role: ChatMessageRole;
  markdown: string;
};
const Message = ({ name, markdown, role }: MessageProps) => {
  return (
    <div className="flex w-full p-6 mb-2 bg-white rounded-lg">
      {/* <img className="w-10 h-10 rounded-full" src={avatar} alt={name} /> */}
      <div className="w-10 h-10 min-w-10 rounded-full bg-blue-100 flex items-center justify-center">
        {role === "user" ? <UserIcon /> : <AssistantIcon />}
      </div>
      <div className="flex flex-col ml-4 markdown-body">
        <span className="font-bold">{name}</span>
        <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
      </div>
    </div>
  );
};

export const Content = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatboxRef = useRef<HTMLTextAreaElement>(null);
  const [selectedProviderId, selectProvider] = useState<number>(0);
  const [selectedModelId, selectModel] = useState<number>(0);
  const { messageThread, threadOpId } = useMessageStore();
  const thread = messageThread();
  const toi = threadOpId();

  const [textInputValue, setTextInputValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastMessage, setLastMessage] = useState<ChatMessage | null>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    chatboxRef.current?.focus();
  }, [toi]);

  useEffect(() => {
    if (lastMessage) {
      // ignore the last message if it's already in the list
      if (thread.find((m) => m.message === lastMessage.message)) {
        setMessages([...thread]);
      } else {
        setMessages([...thread, lastMessage]);
      }
    } else {
      setMessages([...thread]);
    }
  }, [thread, lastMessage]);

  // const shouldScrollToBottom = () => {
  //   const $scrollEl = scrollRef.current;
  //   return $scrollEl
  //     ? $scrollEl.scrollHeight - $scrollEl.scrollTop === $scrollEl.clientHeight
  //     : false;
  // };

  const scrollToBottom = () => {
    const $scrollEl = scrollRef.current;
    requestAnimationFrame(() => {
      $scrollEl?.scrollTo({
        top: $scrollEl.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  const onSubmit = async () => {
    setBusy(true);

    const userPrompt = textInputValue;
    setTextInputValue("");

    const newId = await addMessage({
      name: "User",
      role: "user",
      message: userPrompt,
      replyTo: messages[messages.length - 1]?.id,
    });
    scrollToBottom();

    const messageMap = [
      ...messages.map(({ role, message }) => ({
        content: message,
        role,
      })),
      {
        role: "user",
        content: userPrompt,
      },
    ];

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

    const author = `${provider.name} (${model.name})`;
    getResponse(
      provider.apiKey,
      provider.endpoint,
      model.model,
      messageMap,
      (responseSnapshot) => {
        setLastMessage({
          id: "irrelevant",
          role: "assistant",
          name: author,
          createdAt: new Date().toISOString(),
          message: responseSnapshot,
          metadata: {
            provider: provider.name,
            model: model.model,
            temperature: 0.5,
          },
        });
        scrollToBottom();
      },
      async (content) => {
        setLastMessage({
          id: "irrelevant",
          role: "assistant",
          name: author,
          createdAt: new Date().toISOString(),
          message: content,
          metadata: {
            provider: provider.name,
            model: model.model,
            temperature: 0.5,
          },
        });
        // const _evenNewerId =
        await addMessage({
          name: author,
          role: "assistant",
          replyTo: newId,
          message: content,
          metadata: {
            provider: provider.name,
            model: model.model,
            temperature: 0.5,
          },
        });
        setLastMessage(null);
        setBusy(false);
        // if (s) {
        setTimeout(() => {
          scrollToBottom();
        }, 10);
        // }
      }
    );
  };

  return (
    <div className="flex flex-col flex-grow h-full">
      <Navbar
        selectedProviderId={selectedProviderId}
        selectedModelId={selectedModelId}
        selectProvider={selectProvider}
        selectModel={selectModel}
      />
      <div
        className="p-6 flex-grow flex-col-reverse overflow-auto bg-slate-100"
        ref={scrollRef}
      >
        {[...messages].map(({ id, name, role, message }) => (
          <Message key={id} name={name} role={role} markdown={message} />
        ))}
        {/* {lastMessage && (
            <Message
              name={lastMessage.name}
              role={lastMessage.role}
              key={lastMessage.id}
              markdown={lastMessage.message}
            />
          )} */}
      </div>
      {/* chat box at the bottom */}
      <div className="flex items-center w-full bg-slate-100 px-6 py-4 relative">
        <textarea
          className="flex-grow pl-6 pr-12 py-4 border-0 bg-white rounded-lg"
          style={{
            height:
              2 +
              Math.max(
                1.5,
                Math.min(textInputValue.split("\n").length * 1.5, 20)
              ) +
              "rem",
          }}
          placeholder="Type a message..."
          value={textInputValue}
          onChange={(e) => setTextInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          ref={chatboxRef}
        />
        <button
          type="button"
          className="absolute right-8 top-6 flex items-center justify-center w-10 h-10 rounded-lg text-slate-300 hover:bg-slate-200 hover:text-slate-500 active:scale-95"
          onClick={onSubmit}
          disabled={busy}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
};
