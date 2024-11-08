import db from "./db";

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

export const getProviders = async () => {
  const providers = await db.select(`SELECT * FROM providers`);
  return providers as StoredProvider[];
};

export const addProvider = async (provider: Provider) => {
  await db.execute(
    `INSERT INTO providers (name, endpoint, apiKey) VALUES ($1, $2, $3)`,
    [provider.name, provider.endpoint, provider.apiKey]
  );
};

export const removeProvider = async (providerId: number) => {
  await db.execute(`DELETE FROM models WHERE providerId = $1`, [providerId]);
  await db.execute(`DELETE FROM providers WHERE id = $1`, [providerId]);
  // Also remove all models associated with this provider
};

export const updateProvider = async (
  providerId: number,
  provider: Provider
) => {
  await db.execute(
    `UPDATE providers SET name = $1, endpoint = $2, apiKey = $3 WHERE id = $4`,
    [provider.name, provider.endpoint, provider.apiKey, providerId]
  );
};

export const getModels = async (providerId: number) => {
  const models = await db.select(`SELECT * FROM models WHERE providerId = $1`, [
    providerId,
  ]);
  return models as StoredModel[];
};

export const addModel = async (model: Model) => {
  // Make sure the provider exists
  const provider = (await db.select(`SELECT * FROM providers WHERE id = $1`, [
    model.providerId,
  ])) as StoredProvider[];
  if (provider.length === 0) {
    throw new Error(`Provider with id ${model.providerId} does not exist`);
  }
  await db.execute(
    `INSERT INTO models (name, model, providerId) VALUES ($1, $2, $3)`,
    [model.name, model.model, model.providerId]
  );
};

export const removeModel = async (modelId: number) => {
  await db.execute(`DELETE FROM models WHERE id = $1`, [modelId]);
};

export const updateModel = async (modelId: number, model: PartialModel) => {
  await db.execute(`UPDATE models SET name = $1, model = $2 WHERE id = $3`, [
    model.name,
    model.model,
    modelId,
  ]);
};

export const getAll = async () => {
  const rows = await Promise.all([
    await db.select(`SELECT * FROM providers;`),
    await db.select(`SELECT * FROM models;`),
  ]);
  const providers = rows[0] as StoredProvider[];
  const models = rows[1] as StoredModel[];

  return providers.map((provider) => ({
    ...provider,
    models: models.filter((model) => model.providerId === provider.id),
  }));
};
