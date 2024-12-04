import { useContext, useEffect, useState } from "react";
import db from "../state/db";
import { SearchIcon, XIcon, DeleteIcon } from "./Icons";
import { MessageContext } from "../state/messageContext";
import type { MessageStoreContext, ChatMessage } from "../state/messageContext";

const getSearchResults = async (query: string) => {
  return (
    await db.select<{ path: string; data: string; snippet: string }>(
      `SELECT
      messages.path as path,
      messages.data as data,
      snippet(messages_fts, 2, '<b>', '</b>', '...', 30) as snippet
    FROM
      messages_fts
    JOIN
      messages ON messages.id = messages_fts.id
    WHERE
      messages_fts MATCH '${query}'
    ORDER BY
      rank
    LIMIT 50`
    )
  ).map(({ path, data, snippet }) => {
    return {
      treeId: path,
      ...JSON.parse(data),
      snippet,
    };
  }) as (ChatMessage & { snippet: string })[];
};

type SearchbarProps = {
  query: string;
  setQuery: (query: string) => void;
};
const Searchbar = ({ query, setQuery }: SearchbarProps) => (
  <div className="relative">
    <input
      type="text"
      className="w-full h-10 px-4 mb-4 text-sm border-0 rounded-full bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
      placeholder="Search..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
    <button
      className="absolute w-8 h-8 top-1 right-1 text-slate-500 hover:bg-slate-300 flex items-center justify-center rounded-full active:scale-95"
      style={{ pointerEvents: query ? "auto" : "none" }}
      onClick={() => setQuery("")}
    >
      <SearchIcon
        className={
          "absolute w-5 h-5 transition-all" + (!!query && " opacity-0 scale-0")
        }
      />
      <DeleteIcon
        className={
          "absolute w-5 h-5 transition-all" + (!query && " opacity-0 scale-0")
        }
      />
    </button>
  </div>
);

type LinkProps = {
  onOpen: () => void;
  onDelete?: () => void;
  label: string;
};
const Link = ({ onOpen, onDelete, label }: LinkProps) => (
  <a
    className="flex items-center flex-shrink-0 h-10 text-sm font-medium rounded hover:bg-slate-200 active:bg-slate-100 group mr-2"
    href="#"
    onClick={onOpen}
  >
    <span
      className="p-4 leading-none truncate"
      // TODO: Sanitize label (but allow snippets to bold stuff?!?)...
      dangerouslySetInnerHTML={{ __html: label }}
    />
    {/* delete button */}
    {onDelete === undefined ? null : (
      <button
        className="w-6 min-w-6 h-6 mr-2 ml-auto text-slate-500 hover:bg-red-400 items-center justify-center rounded group-hover:flex hover:text-white active:scale-95 active:bg-red-500 hidden"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <XIcon className="w-4 h-4" />
      </button>
    )}
  </a>
);

const LoadingIndicator = ({ show }: { show: boolean }) => {
  return (
    <div
      className="absolute text-center w-full h-full flex justify-center items-center pb-20"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        opacity: show ? 1 : 0,
        pointerEvents: show ? "auto" : "none",
        transition: "all 120ms ease-in-out",
      }}
    >
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-400"></div>
    </div>
  );
};

const ErrorIndicator = ({
  show,
  message,
}: {
  show: boolean;
  message: string;
}) => {
  return (
    <div
      className="absolute text-center w-full h-full flex justify-center items-start pt-4"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        opacity: show ? 1 : 0,
        pointerEvents: show ? "auto" : "none",
        transition: "all 120ms ease-in-out",
      }}
    >
      <div className="bg-red-500 text-red-100 rounded-lg p-4">
        <div className="border-b-2 border-red-100 text-left pb-2 mb-2 font-bold">
          Error:
        </div>
        {message}
      </div>
    </div>
  );
};

export const SecondarySidebar = () => {
  const {
    data,
    topLevelState: state,
    topLevelError: error,
  } = useContext<MessageStoreContext>(MessageContext);
  const {
    topLevelMessages: threadOps,
    setTopLevelMessage,
    setActiveMessage,
    removeMessageAndDescendants,
  } = data;

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

  // useEffect(() => {
  //   const latestMessage = mostRecentMessageInTree(messageTree);
  //   if (latestMessage) {
  //     setActiveMessage(latestMessage.treeId);
  //   }
  // }, [messageTree]);

  // TODO: Sanitize label (but allow snippets to bold stuff?!?)...
  const messageListToUse = query
    ? searchResults.map((m) => ({
        treeId: m.treeId,
        label: m.message,
      }))
    : threadOps.map((m) => ({
        treeId: m.treeId,
        label: m.message.slice(0, 50),
      }));

  return (
    <div className="flex flex-col flex-grow p-4 h-full max-h-full">
      <div>
        <Searchbar query={query} setQuery={setQuery} />
      </div>
      <div className="flex-grow overflow-auto relative">
        <ErrorIndicator show={state === "error"} message={error.message} />
        <LoadingIndicator show={state === "loading"} />
        {messageListToUse.map(({ label, treeId }) => (
          <Link
            key={treeId}
            label={label}
            onOpen={() => setTopLevelMessage(treeId)}
            onDelete={
              query
                ? undefined
                : async () => {
                    const sure = await window.confirm(
                      "Are you sure you want to delete this entire message thread?"
                    );
                    if (sure) {removeMessageAndDescendants(treeId)};
                  }
            }
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
