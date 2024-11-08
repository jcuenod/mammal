import Database from "@tauri-apps/plugin-sql";
// when using `"withGlobalTauri": true`, you may use
// const V = window.__TAURI__.sql;

const TIMEOUT = 2500;

let dbRef: Database | null = null;

Database.load("sqlite:mammal.db").then(async (db) => {
  dbRef = db;
  await db.execute(`PRAGMA journal_mode=WAL;`);
  const count = await db.select(`SELECT count(*) FROM messages`);
  console.log(count);
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  select: async (query: string, bindValues: any[] = []) => {
    if (!dbRef) {
      await wait(TIMEOUT);
      if (!dbRef) throw new Error("Database not loaded");
    }
    return dbRef.select(query, bindValues);
  },
  execute: async (query: string, bindValues: any[] = []) => {
    if (!dbRef) {
      await wait(TIMEOUT);
      if (!dbRef) throw new Error("Database not loaded");
    }
    return dbRef.execute(query, bindValues);
  },
};
