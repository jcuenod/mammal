import { create } from "zustand";
import db from "./db";
import { computed } from "./zustandCompute";

export type ChatMessageRole = "user" | "assistant" | "system";
export type ChatMessage = {
  id: string; // like 123.512.52 (so the first message will be 1, the first reply 1.1; if you regenerate the first reply it will be 1.2)
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

const mapRowToChatMessage = (row: any): ChatMessage => {
  const metadata = JSON.parse(row.metadata);
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    createdAt: row.createdAt,
    message: row.message,
    metadata,
  };
};

const getThreadOpId = (id: string) => {
  return id.split(".")[0];
};

const isSameThread = (id1: string, id2: string) => {
  return getThreadOpId(id1) === getThreadOpId(id2);
};

type MessageStore = {
  threadOps: ChatMessage[];
  activeMessage: string | null;
  threadOpId: () => string | null;
  messageTree: ChatMessage[];
  messageThread: () => ChatMessage[];

  _cacheInvalidation: number;
  init: () => boolean;
};
export const useMessageStore = create<MessageStore>((set, get) => ({
  threadOps: [],
  activeMessage: null,
  messageTree: [],
  threadOpId: computed(
    () => [get().activeMessage],
    (activeMessage: string | null) =>
      activeMessage ? getThreadOpId(activeMessage) : null
  ),
  _cacheInvalidation: 0,
  init: computed(
    () => [get().activeMessage, get()._cacheInvalidation],
    (activeMessage: string | null, _cacheInvalidation: number) => {
      const threadOpId =
        typeof activeMessage === "string" && getThreadOpId(activeMessage);

      const queries = [
        db.select(
          `SELECT * FROM messages WHERE id IN (
                SELECT DISTINCT 
                    CASE
                        WHEN INSTR(id, '.') > 0 THEN SUBSTR(id, 1, INSTR(id, '.') - 1)
                        ELSE id
                    END AS threadOpId
                FROM messages
          )`
        ),
        db.select(
          `SELECT * FROM messages WHERE id = '${threadOpId}' OR id LIKE '${threadOpId}.%'`
        ),
      ];

      Promise.all(queries).then((results) => {
        const threadOps = (results[0] as any[]).map(mapRowToChatMessage);
        const messageTree = (results[1] as any[]).map(mapRowToChatMessage);
        set({ threadOps, messageTree });
      });
      return false;
    }
  ),
  messageThread: computed(
    () => [get().messageTree, get().activeMessage],
    (messageTree: ChatMessage[], activeMessage: string | null) =>
      messageTree
        .filter(
          (m) =>
            typeof activeMessage === "string" && activeMessage.includes(m.id)
        )
        .sort()
  ),
}));

export const deleteMessageAndDescendants = async (id: string) => {
  await db.execute(
    `DELETE FROM messages WHERE id = ${id} OR id LIKE '${id}.%'`
  );
  useMessageStore.setState((state) => {
    return {
      activeMessage: null,
      _cacheInvalidation: state._cacheInvalidation + 1,
    };
    // const newMessageTree = state.messageTree.filter((m) => !m.id.includes(id));
    // return {
    //   activeMessage: newMessageTree.length ? newMessageTree[0].id : null,
    // };
  });
};

type AddMessage = {
  name: string;
  role: ChatMessageRole;
  message: string;
  metadata?: {
    provider?: string;
    model?: string;
    temperature?: number;
  };
  replyTo?: string;
};
export const addMessage = async ({
  name,
  role,
  message,
  metadata,
  replyTo,
}: AddMessage) => {
  // if replyTo is provided, we need to find the max immediate descendant of the replyTo message and increment by 1 for this id
  // otherwise, we need to find the max top-level message and increment by 1 for this id
  const getNewDescendantId = async (replyTo: string) => {
    const ids = (await db.select(
      `SELECT id FROM messages WHERE id LIKE '${replyTo}.%'`
    )) as { id: string }[];
    const maxId =
      ids
        .map((m) => m.id.split(".").pop())
        .filter((m) => m !== undefined)
        .map((m) => parseInt(m))
        .sort()
        .pop() || 0;
    return `${replyTo}.${maxId + 1}`;
  };
  const getNewTopLevelId = async () => {
    const ids = (await db.select(
      `SELECT id FROM messages WHERE id NOT LIKE '%.%'`
    )) as { id: string }[];
    const maxId =
      ids
        .map((m) => parseInt(m.id))
        .sort()
        .pop() || 0;
    return `${maxId + 1}`;
  };
  const newId = replyTo
    ? await getNewDescendantId(replyTo)
    : await getNewTopLevelId();
  await db.execute(
    `INSERT INTO messages (id, name, role, createdAt, message, metadata) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      newId,
      name,
      role,
      new Date().toISOString(),
      message,
      JSON.stringify(metadata || {}),
    ]
  );
  useMessageStore.setState((state) => {
    return {
      activeMessage: newId,
      _cacheInvalidation: state._cacheInvalidation + 1,
    };
  });
  return newId;
};

export const setActiveMessage = async (id: string | null) => {
  const { activeMessage } = useMessageStore.getState();
  if (
    typeof id === "string" &&
    typeof activeMessage === "string" &&
    !isSameThread(id, activeMessage)
  ) {
    // await _reloadMessageTree();
  }
  useMessageStore.setState({ activeMessage: id });
};
