import { createContext } from "react";

// CREATE TABLE IF NOT EXISTS providers (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     name TEXT NOT NULL,
//     endpoint TEXT NOT NULL,
//     apiKey TEXT NOT NULL
// );

// CREATE TABLE IF NOT EXISTS models (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     name TEXT NOT NULL,
//     model TEXT NOT NULL,
//     providerId INTEGER NOT NULL,
//     FOREIGN KEY (providerId) REFERENCES providers(id)
// );

export type Provider = {
  name: string;
  endpoint: string;
  apiKey: string;
};
export type StoredProvider = Provider & { id: number };

export type PartialModel = {
  name: string;
  model: string;
};
export type Model = {
  providerId: number;
} & PartialModel;
export type StoredModel = Model & { id: number };

export type ProviderWithModels = StoredProvider & { models: StoredModel[] };

type ModelProviderContext = {
  refresh: () => void;
  providers: ProviderWithModels[];
};
export const ModelProviderContext = createContext<ModelProviderContext>({
  refresh: () => {},
  providers: [],
});
