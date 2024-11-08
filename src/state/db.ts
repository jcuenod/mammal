import Database from "@tauri-apps/plugin-sql";
// when using `"withGlobalTauri": true`, you may use
// const V = window.__TAURI__.sql;

const TIMEOUT = 250;

let dbRef: Database | null = null;

const db = Database.load("sqlite:mammal.db");

(async () => {
  const d = await db;
  dbRef = d;
  await dbRef.execute(`PRAGMA journal_mode=WAL;`);
  await dbRef.execute(`PRAGMA busy_timeout = 5000;`);
  await dbRef.execute(`PRAGMA cache_size = -20000;`);
  await dbRef.execute(`PRAGMA foreign_keys = ON;`);
  await dbRef.execute(`PRAGMA auto_vacuum = INCREMENTAL;`);
  await dbRef.execute(`PRAGMA page_size = 8192;`);
  const result = await dbRef.select<{
    "count(*)": number;
  }[]>(`SELECT count(*) FROM messages`);
  console.log(result?.[0]);
})();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  select: async (query: string, bindValues: any[] = []) => {
    if (!dbRef) {
      await wait(TIMEOUT);
      if (!dbRef) throw new Error("Database not loaded");
    }
    return await dbRef.select(query, bindValues);
  },
  execute: async (query: string, bindValues: any[] = []) => {
    if (!dbRef) {
      await wait(TIMEOUT);
      if (!dbRef) throw new Error("Database not loaded");
    }
    return await dbRef.execute(query, bindValues);
  },
};
