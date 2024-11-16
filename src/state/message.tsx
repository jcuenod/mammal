import React, { useEffect, useState } from "react";
import { MessageContext } from "./messageContext";
import type {
  MessageStoreContext,
  AddMessage,
  MessageStoreLoadingState,
} from "./messageContext";
import db from "./db";
import { ChatMessage } from "./messageContext";
// import { computed } from "./zustandCompute";

const mapRowToChatMessage = (row: any): ChatMessage => {
  const metadata = JSON.parse(row.metadata);
  return {
    treeId: row.treeId,
    role: row.role,
    name: row.name,
    createdAt: row.createdAt,
    message: row.message,
    metadata,
  };
};

const isNodeAncestorOf = (nodeTreeId: string, potentialAncestor: string) => {
  return (
    nodeTreeId.includes(potentialAncestor) &&
    nodeTreeId.split(".").length > potentialAncestor.split(".").length
  );
};

const getAncestorsOf = (
  nodeTreeId: string,
  tree: ChatMessage[],
  includeSelf: boolean = true
) =>
  tree
    .filter(
      (m) =>
        isNodeAncestorOf(nodeTreeId, m.treeId) ||
        (includeSelf && m.treeId === nodeTreeId)
    )
    .sort((a, b) => a.treeId.length - b.treeId.length);

const mapTreeToThread = (
  tree: ChatMessage[],
  activeMessageId: string
): ChatMessage[] => {
  // we use the id to get all parents and then for children we select the highest createdAt
  // Initialize with parents of activeMessageId
  const threadMessages = getAncestorsOf(activeMessageId, tree);

  if (!threadMessages.length) {
    return [];
  }
  let lastMessage: string;
  while (true && threadMessages.length > 0) {
    lastMessage = threadMessages[threadMessages.length - 1].treeId;

    const descendantsOfLast = tree.filter((m) =>
      isNodeAncestorOf(m.treeId, lastMessage)
    );
    if (descendantsOfLast.length === 0) {
      break;
    }

    // get last createdAt
    const mostRecentDescendant = descendantsOfLast.reduce((acc, m) => {
      if (m.createdAt > acc.createdAt) {
        acc = m;
      }
      return acc;
    }, descendantsOfLast[0]);

    threadMessages.push(
      ...getAncestorsOf(mostRecentDescendant.treeId, descendantsOfLast)
    );
  }
  return threadMessages.sort((a, b) => a.treeId.length - b.treeId.length);
};

const getThreadOpId = (treeId: string) => {
  return treeId.split(".")[0];
};

const getTopLevelMessages = async () => {
  return (
    (await db.select(
      `SELECT
       treeId,
       role,
       name,
       createdAt,
       message,
       metadata
     FROM messages WHERE treeId IN (
        SELECT DISTINCT 
            CASE
                WHEN INSTR(treeId, '.') > 0 THEN SUBSTR(treeId, 1, INSTR(treeId, '.') - 1)
                ELSE treeId
            END AS threadOpId
        FROM messages
      )`
    )) as {
      treeId: string;
      role: string;
      name: string;
      createdAt: string;
      message: string;
      metadata: string;
    }[]
  ).map(mapRowToChatMessage);
};

const getTree = async (topLevelId: string) =>
  (
    (await db.select(
      `SELECT
         treeId,
         role,
         name,
         createdAt,
         message,
         metadata
       FROM messages WHERE treeId LIKE ? OR treeId LIKE ?`,
      [topLevelId, `${topLevelId}.%`]
    )) as {
      treeId: string;
      role: string;
      name: string;
      createdAt: string;
      message: string;
      metadata: string;
    }[]
  ).map(mapRowToChatMessage);

export const addMessage = async ({ data, parentId }: AddMessage) => {
  // if replyTo is provided, we need to find the max immediate descendant of the replyTo message and increment by 1 for this treeId
  // otherwise, we need to find the max top-level message and increment by 1 for this treeId
  const { name, role, message, metadata } = data;
  const getNewDescendantId = async (parentId: string) => {
    const treeIds = (await db.select(
      `SELECT treeId FROM messages WHERE treeId LIKE '${parentId}.%'`
    )) as { treeId: string }[];
    const maxId =
      treeIds
        .map((m) => m.treeId.split(".").pop())
        .filter((m) => m !== undefined)
        .map((m) => parseInt(m))
        .sort()
        .pop() || 0;
    return `${parentId}.${maxId + 1}`;
  };
  const getNewTopLevelId = async () => {
    const treeIds = (await db.select(
      `SELECT treeId FROM messages WHERE treeId NOT LIKE '%.%'`
    )) as { treeId: string }[];
    const maxId =
      treeIds
        .map((m) => parseInt(m.treeId))
        .sort()
        .pop() || 0;
    return `${maxId + 1}`;
  };
  const newTreeId = parentId
    ? await getNewDescendantId(parentId)
    : await getNewTopLevelId();
  await db.execute(
    `INSERT INTO messages (treeId, name, role, createdAt, message, metadata) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      newTreeId,
      name,
      role,
      new Date().toISOString(),
      message,
      JSON.stringify(metadata || {}),
    ]
  );
  return newTreeId;
};

const removeMessageAndDescendants = async (
  treeId: string,
  callback: () => void
) => {
  await db.execute(`DELETE FROM messages WHERE treeId = ? OR treeId LIKE ?`, [
    treeId,
    `${treeId}.%`,
  ]);
  callback();
};

const MessageProviderContextWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [updateActiveFlag, setUpdateActiveFlag] = useState<boolean>(false);
  const [topLevelMessages, setTopLevelMessages] = useState<ChatMessage[]>([]);
  const [messageTree, setMessageTree] = useState<ChatMessage[]>([]);
  const [topLevelContextState, setTopLevelContextState] =
    useState<MessageStoreLoadingState>("init");
  const [messageContextState, setMessageContextState] =
    useState<MessageStoreLoadingState>("init");
  const [messageErrorMessage, setMessageErrorMessage] = useState<string>("");
  const [topLevelErrorMessage, setTopLevelErrorMessage] = useState<string>("");

  const refreshTopLevelMessages = (activeMessage: string | null) => {
    setTopLevelContextState("loading");
    getTopLevelMessages()
      .then((messages) => {
        setTopLevelMessages(messages);
        setTopLevelContextState("ready");
        if (activeMessage === null && messages.length > 0) {
          const activeMessageTopLevelId = getThreadOpId(messages[0].treeId);
          if (!messages.some((m) => m.treeId === activeMessageTopLevelId)) {
            setActiveMessage(messages[0].treeId);
          }
        }
      })
      .catch((e) => {
        console.error(e);
        setTopLevelContextState("error");
        setTopLevelErrorMessage(JSON.stringify(e));
      });
  };

  const refreshMessages = (activeMessage: string | null) => {
    if (activeMessage) {
      setMessageContextState("loading");
      getTree(getThreadOpId(activeMessage))
        .then((tree) => {
          setMessageTree(tree);
          setMessageContextState("ready");
        })
        .catch((e) => {
          console.error(e);
          setMessageContextState("error");
          setMessageErrorMessage(JSON.stringify(e));
        });
    } else {
      setMessageTree([]);
      setMessageContextState("ready");
    }
  };

  useEffect(() => refreshTopLevelMessages(activeMessage), []);

  useEffect(() => refreshMessages(activeMessage), [activeMessage]);

  useEffect(() => {
    if (updateActiveFlag && messageTree.length > 0) {
      const mostRecentMessage = messageTree.reduce((acc, m) => {
        if (m.createdAt > acc.createdAt) {
          acc = m;
        }
        return acc;
      }, messageTree[0]);
      setActiveMessage(mostRecentMessage.treeId);
      setUpdateActiveFlag(false);
    }
  }, [messageTree]);

  const context: MessageStoreContext = {
    data: {
      topLevelMessages,
      activeMessage,
      threadOpId: activeMessage ? getThreadOpId(activeMessage) : null,
      messageTree,
      messageThread: activeMessage
        ? mapTreeToThread(messageTree, activeMessage)
        : [],
      setTopLevelMessage: (treeId: string) => {
        setUpdateActiveFlag(true);
        setActiveMessage(treeId);
      },
      setActiveMessage,
      addMessage: async (m: AddMessage) => {
        const newId = await addMessage(m);
        // (async () => {
        refreshTopLevelMessages(newId);
        // })();
        setActiveMessage(newId);
        return newId;
      },
      removeMessageAndDescendants: (treeId: string) => {
        removeMessageAndDescendants(treeId, () => {
          refreshTopLevelMessages(activeMessage);
          refreshMessages(activeMessage);
        });
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
  };

  return (
    <MessageContext.Provider value={context}>
      {children}
    </MessageContext.Provider>
  );
};
export default MessageProviderContextWrapper;
