import React, { useEffect, useState } from "react";
import { MessageContext } from "./messageContext";
import type {
  MessageStoreContext,
  AddMessage,
  MessageStoreLoadingState,
  MessageThread,
} from "./messageContext";
import db from "./db";
import { ChatMessage } from "./messageContext";
import MPTree from "../treebeard/src/MPTree";
import type { MPTreeNodeWithChildren } from "../treebeard/src/MPTreeNode";

const dboperations = {
  select: db.select,
  execute: (query: string, params?: unknown[]) =>
    new Promise<void>(async (resolve, reject) => {
      try {
        await db.execute(query, params);
        resolve();
      } catch (e) {
        console.error(e);
        reject(e);
      }
    }),
};

const messageMPTree = new MPTree(
  "messages",
  dboperations.select,
  dboperations.execute
);

const getRootPath = (treeId: string) => {
  return treeId.split(".")[0];
};

const pathIsAncestorOf = (ancestorPath: string, descendantPath: string) => {
  return (
    descendantPath.startsWith(ancestorPath) &&
    descendantPath.split(".").length > ancestorPath.split(".").length
  );
};

const mapTreeToThread = (
  tree: MPTreeNodeWithChildren,
  activeMessageId: string
): MessageThread[] => {
  const gatherAncestorsAndSelf: (
    accumulator: MPTreeNodeWithChildren[],
    mp: MPTreeNodeWithChildren,
    descendant: string
  ) => MPTreeNodeWithChildren[] = (
    accumulator: MPTreeNodeWithChildren[] = [],
    mp: MPTreeNodeWithChildren,
    descendant: string
  ) => {
    const { node, children } = mp;
    if (pathIsAncestorOf(node.path, descendant) || node.path === descendant) {
      return [
        ...accumulator,
        mp,
        ...children
          .map((c) => gatherAncestorsAndSelf([], c, descendant))
          .flat(),
      ];
    }
    return accumulator;
  };
  const orderedAncestors = gatherAncestorsAndSelf([], tree, activeMessageId);

  const threadMessages: MessageThread[] = orderedAncestors.map((a) => ({
    treeId: a.node.path,
    role: a.node.data.role,
    name: a.node.data.name,
    createdAt: a.node.data.createdAt,
    message: a.node.data.message,
    metadata: a.node.data.metadata,
    getSiblings: async (includeSelf: boolean) =>
      a.node.getSiblings(includeSelf),
  }));

  // Now we check whether the active message is in the tree
  // If it's not, that probably means we haven't refreshed the tree yet
  // It also means there's not point in looking for descendants
  const lastMessage = orderedAncestors?.[orderedAncestors.length - 1];
  if (lastMessage?.node.path !== activeMessageId) {
    return threadMessages;
  }
  const activeMessage = lastMessage;

  // traverse into active message's descendants and push each message onto the thread
  const traverseDescendants = (mp: MPTreeNodeWithChildren) => {
    const { children } = mp;
    if (children.length === 0) {
      return;
    }
    // get the most recent child
    const mostRecentChild = children.reduce(
      (acc, child) =>
        child.node.data.createdAt > acc.node.data.createdAt ? child : acc,
      children[0]
    );
    threadMessages.push({
      treeId: mostRecentChild.node.path,
      role: mostRecentChild.node.data.role,
      name: mostRecentChild.node.data.name,
      createdAt: mostRecentChild.node.data.createdAt,
      message: mostRecentChild.node.data.message,
      metadata: mostRecentChild.node.data.metadata,
      getSiblings: async (includeSelf) =>
        mostRecentChild.node.getSiblings(includeSelf),
    });
    traverseDescendants(mostRecentChild);
  };
  traverseDescendants(activeMessage);

  return threadMessages.sort((a, b) => a.treeId.length - b.treeId.length);
};

const MessageProviderContextWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [updateActiveFlag, setUpdateActiveFlag] = useState<boolean>(false);
  const [topLevelMessages, setTopLevelMessages] = useState<ChatMessage[]>([]);
  const [messageTree, setMessageTree] = useState<MPTreeNodeWithChildren | null>(
    null
  );
  const [topLevelContextState, setTopLevelContextState] =
    useState<MessageStoreLoadingState>("init");
  const [messageContextState, setMessageContextState] =
    useState<MessageStoreLoadingState>("init");
  const [messageErrorMessage, setMessageErrorMessage] = useState<string>("");
  const [topLevelErrorMessage, setTopLevelErrorMessage] = useState<string>("");

  const messageThread =
    messageTree !== null && activeMessage !== null
      ? mapTreeToThread(messageTree, activeMessage)
      : [];

  const refreshTopLevelMessages = (activeMessage: string | null) => {
    setTopLevelContextState("loading");
    messageMPTree.getRootNodes().then((nodes) => {
      setTopLevelMessages(
        nodes.map((n) => ({
          treeId: n.path,
          role: n.data.role,
          name: n.data.name,
          createdAt: n.data.createdAt,
          message: n.data.message,
          metadata: n.data.metadata,
        }))
      );
      setTopLevelContextState("ready");
      if (activeMessage === null && nodes.length > 0) {
        const activeMessageTopLevelId = nodes[0].path;
        if (!nodes.some((n) => n.path === activeMessageTopLevelId)) {
          setActiveMessage(activeMessageTopLevelId);
        }
      }
    });
  };

  const refreshMessages = async (activeMessage: string | null) => {
    if (activeMessage) {
      setMessageContextState("loading");
      const rootPath = getRootPath(activeMessage);
      const tree = await messageMPTree.getTree(rootPath);
      if (tree) {
        setMessageTree(tree);
        setMessageContextState("ready");
        return;
      }
    }
    setMessageTree(null);
    setMessageContextState("ready");
  };

  useEffect(() => refreshTopLevelMessages(activeMessage), []);

  useEffect(() => {
    if (updateActiveFlag && messageThread.length > 0) {
      console.log("Updating active message");
      const mostRecentMessage = messageThread[messageThread.length - 1];
      setActiveMessage(mostRecentMessage.treeId);
      setUpdateActiveFlag(false);
    }
  }, [messageThread]);

  useEffect(() => {
    refreshMessages(activeMessage);
  }, [activeMessage]);

  const context: MessageStoreContext = {
    data: {
      topLevelMessages,
      activeMessage,
      threadOpId: activeMessage ? getRootPath(activeMessage) : null,
      messageTree,
      messageThread,
      setTopLevelMessage: (treeId: string) => {
        setUpdateActiveFlag(true);
        setActiveMessage(treeId);
      },
      setActiveMessage,
      addMessage: async ({ data, parentId }: AddMessage) => {
        const newNode = await messageMPTree.addNode(parentId || null, data);
        if (!newNode) {
          console.error("Failed to add message");
          return null;
        }

        refreshTopLevelMessages(newNode.path);
        setActiveMessage(newNode.path);
        return newNode.path;
      },
      removeMessageAndDescendants: async (treeId: string) => {
        await messageMPTree.deleteNode(treeId);
        refreshTopLevelMessages(activeMessage);
        refreshMessages(activeMessage);
      },
    },
    messageState: messageContextState,
    messageError: {
      message: messageErrorMessage,
    },
    topLevelState: topLevelContextState,
    topLevelError: {
      message: topLevelErrorMessage,
    },
    getThreadEndingAt: async (treeId: string) => {
      const rootPath = getRootPath(treeId);
      const tree = await messageMPTree.getTree(rootPath);
      if (!tree) {
        return [];
      }

      const unprunedThread = mapTreeToThread(tree, treeId);
      const threadEndingAtId = unprunedThread.filter(
        (m) => pathIsAncestorOf(m.treeId, treeId) || m.treeId === treeId
      );
      return threadEndingAtId;
    },
  };

  return (
    <MessageContext.Provider value={context}>
      {children}
    </MessageContext.Provider>
  );
};
export default MessageProviderContextWrapper;
