import { createContext } from "react";
import MPTreeNode from "../treebeard/src/MPTreeNode";
import type { MPTreeNodeWithChildren } from "../treebeard/src/MPTreeNode";

export type MessageThread = {
  treeId: string;
  role: string;
  name: string;
  createdAt: string;
  message: string;
  metadata: string;
  getSiblings: (includeSelf: boolean) => Promise<MPTreeNode[]>;
};

export type ChatMessageRole = "user" | "assistant" | "system";
export type ChatMessage = {
  treeId: string; // like 123.512.52 (so the first message will be 1, the first reply 1.1; if you regenerate the first reply it will be 1.2)
  role: ChatMessageRole;
  name: string;
  createdAt: string;
  message: string;
  metadata: {
    provider?: string;
    model?: string;
    temperature?: number;
  };
};
export type AddMessage = {
  data: {
    name: string;
    role: ChatMessageRole;
    message: string;
    metadata?: {
      provider?: string;
      model?: string;
      temperature?: number;
    };
  };
  parentId?: string;
};
type MessageStore = {
  topLevelMessages: ChatMessage[];
  activeMessage: string | null;
  threadOpId: string | null;
  messageTree: MPTreeNodeWithChildren | null;
  messageThread: MessageThread[];
  setTopLevelMessage: (treeId: string) => void;
  setActiveMessage: (treeId: string | null) => void;
  addMessage: (message: AddMessage) => Promise<string | null>;
  removeMessageAndDescendants: (treeId: string) => void;
};
export type MessageStoreLoadingState = "loading" | "error" | "ready" | "init";
export interface MessageStoreContext {
  data: MessageStore;
  messageState: MessageStoreLoadingState;
  messageError: {
    message: string;
  };
  topLevelState: MessageStoreLoadingState;
  topLevelError: {
    message: string;
  };
}

export const MessageContext = createContext<MessageStoreContext>({
  data: {
    topLevelMessages: [],
    activeMessage: null,
    threadOpId: null,
    messageTree: null,
    messageThread: [],
    setTopLevelMessage: () => {
      console.log("Not yet initialized");
    },
    setActiveMessage: () => {
      console.log("Not yet initialized");
    },
    addMessage: async () => {
      console.log("Not yet initialized");
      return "";
    },
    removeMessageAndDescendants: () => {
      console.log("Not yet initialized");
    },
  },
  messageState: "init",
  messageError: {
    message: "",
  },
  topLevelState: "init",
  topLevelError: {
    message: "",
  },
});
