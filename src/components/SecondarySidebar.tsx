import { useEffect, useState } from "react";
import {
  useMessageStore,
  deleteMessageAndDescendants,
  setActiveMessage,
} from "../state/messages";
import db from "../state/db";
import type { ChatMessage } from "../state/messages";
import { SearchIcon, XIcon, DeleteIcon } from "./Icons";

const mostRecentMessageInTree = (messages: ChatMessage[]) => {
  return messages
    .sort((a, b) => {
      const aDate = a.createdAt;
      const bDate = b.createdAt;
      return aDate > bDate ? 1 : -1;
    })
    .reverse()[0];
};

const getSearchResults = async (query: string) => {
  return (await db.select(
    `SELECT
      messages.*,
      snippet(messages_fts, 0, '<b>', '</b>', '...', 10) as snippet
    FROM
      messages
    JOIN
      messages_fts ON messages.rowid = messages_fts.rowid
    WHERE
      messages_fts MATCH '${query}'
    ORDER BY
      rank
    LIMIT 50`
  )) as (ChatMessage & { snippet: string })[];
};

type SearchbarProps = {
  query: string;
  setQuery: (query: string) => void;
};
const Searchbar = ({ query, setQuery }: SearchbarProps) => (
  <div className="relative">
    <input
      type="text"
      className="w-full h-10 px-4 mb-4 text-sm border-0 rounded-full bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Search..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
    <button className="absolute w-8 h-8 top-1 right-1 text-slate-500 hover:bg-slate-300 flex items-center justify-center rounded-full active:scale-95"
      style={{ pointerEvents: query ? "auto" : "none" }}
      onClick={() => setQuery("")}
    >
      <SearchIcon className={"absolute w-5 h-5 transition-all" + (!!query && " opacity-0 scale-0")} />
      <DeleteIcon className={"absolute w-5 h-5 transition-all" + (!query && " opacity-0 scale-0")} />
    </button>
  </div>
);

type LinkProps = {
  onOpen: () => void;
  onDelete: () => void;
  label: string;
};
const Link = ({ onOpen, onDelete, label }: LinkProps) => (
  <a
    className="flex items-center flex-shrink-0 h-10 text-sm font-medium rounded hover:bg-slate-200 active:bg-slate-100 group mr-2"
    href="#"
    onClick={onOpen}
  >
    <span className="p-4 leading-none truncate"
      dangerouslySetInnerHTML={{ __html: label }}
    />
    {/* delete button */}
    <button
      className="w-6 min-w-6 h-6 mr-2 ml-auto text-slate-500 hover:bg-red-400 items-center justify-center rounded group-hover:flex hover:text-white active:scale-95 active:bg-red-500 hidden"
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
    >
      <XIcon className="w-4 h-4" />
    </button>
  </a>
);

// type SecondarySidebarProps = {
//   setActiveMessage: (threadId: number | null) => void;
// };
export const SecondarySidebar = () => {
  const { threadOps, messageTree } = useMessageStore();
  const [query, setQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (query) {
      getSearchResults(query).then((r) => {
        const mappedMessages = r.map(({ snippet, ...m }) => {
          return {
            ...m,
            message: snippet,
          };
        });
        setSearchResults(mappedMessages);
      });
    } else {
      setSearchResults([]);
    }
  }, [query]);

  useEffect(() => {
    const latestMessage = mostRecentMessageInTree(messageTree);
    if (latestMessage) {
      setActiveMessage(latestMessage.treeId);
    }
  }, [messageTree]);

  const messageListToUse = query ? searchResults : threadOps;

  return (
    <div className="flex flex-col flex-grow p-4 h-full max-h-full">
      <div>
        <Searchbar query={query} setQuery={setQuery} />
      </div>
      <div className="flex-grow overflow-auto">
        {messageListToUse.map(({ message, treeId }: ChatMessage) => (
          <Link
            key={treeId}
            label={message}
            onOpen={() => setActiveMessage(treeId)}
            onDelete={() => {
              deleteMessageAndDescendants(treeId);
            }}
          />
        ))}
      </div>
      <div>
        <a
          className="flex items-center flex-shrink-0 h-10 px-3 mt-auto text-sm font-medium bg-slate-100 rounded hover:bg-slate-200 active:bg-slate-100"
          href="#"
          onClick={async () => {
            setActiveMessage(null);
          }}
        >
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span className="ml-2 leading-none">New Chat</span>
        </a>
      </div>
    </div>
  );
};
