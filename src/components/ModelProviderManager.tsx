import { useEffect, useState } from "react";
import {
  // getProviders,
  addProvider,
  removeProvider,
  updateProvider,
  // getModels,
  addModel,
  // removeModel,
  updateModel,
  getAll,
} from "../state/modelProviders";
import type {
  ProviderWithModels,
  StoredModel,
  StoredProvider,
} from "../state/modelProviders";
import { knownProviders } from "../fixtures/knownProviders";

type AddProviderFormProps = {
  onClose: () => void;
};
const AddProviderForm = ({ onClose }: AddProviderFormProps) => {
  const [knownProvider, setKnownProvider] = useState(knownProviders[0].name);
  const [name, setName] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");

  return (
    <form className="space-y-6">
      <h2 className="text-xl font-semibold">Add Provider</h2>
      <div className="space-y-4">
        <div>
          <select
            className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={knownProvider}
            onChange={(e) => {
              setKnownProvider(e.target.value);
            }}
          >
            {knownProviders.map((provider) => (
              <option key={provider.name} value={provider.name}>
                {provider.name}
              </option>
            ))}
            <option value="Custom Model">Custom Model</option>
          </select>
        </div>
        <div className={knownProvider !== "Custom Model" ? "hidden" : "block"}>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className={knownProvider !== "Custom Model" ? "hidden" : "block"}>
          <label className="block text-sm font-medium mb-1">Endpoint</label>
          <input
            type="text"
            className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">API Key</label>
          <input
            type="password"
            className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300 transition-colors"
            onClick={() => {
              const providerToUse = knownProviders.find(
                (p) => p.name === knownProvider
              );
              const nameToUse = providerToUse ? providerToUse.name : name;
              const endpointToUse = providerToUse
                ? providerToUse.endpoint
                : endpoint;
              addProvider({
                name: nameToUse,
                endpoint: endpointToUse,
                apiKey,
              }).then(async () => {
                if (providerToUse) {
                  const providers = await getAll();
                  const providerJustAdded = providers.find(
                    (p) =>
                      p.name === nameToUse &&
                      p.endpoint === endpointToUse &&
                      p.apiKey === apiKey
                  );
                  if (!providerJustAdded) {
                  } else {
                    await Promise.all([
                      providerToUse.models.map((model) => {
                        addModel({
                          name: model.name,
                          model: model.model,
                          providerId: providerJustAdded.id,
                        });
                      }),
                    ]);
                  }
                }
                onClose();
              });
            }}
          >
            Add Provider
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};
type EditProviderFormProps = {
  selectedProvider: StoredProvider;
  onClose: () => void;
};
const EditProviderForm = ({
  selectedProvider,
  onClose,
}: EditProviderFormProps) => {
  const [name, setName] = useState(selectedProvider.name);
  const [endpoint, setEndpoint] = useState(selectedProvider.endpoint);
  const [apiKey, setApiKey] = useState(selectedProvider.apiKey);

  return (
    <form className="space-y-6">
      <h2 className="text-xl font-semibold">Edit Provider</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Endpoint</label>
          <input
            type="text"
            className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">API Key</label>
          <input
            type="password"
            className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300 transition-colors"
            onClick={() =>
              updateProvider(selectedProvider.id, {
                name,
                endpoint,
                apiKey,
              }).then(onClose)
            }
          >
            Update Provider
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

type AddModelFormProps = {
  providerId: number;
  onClose: () => void;
};
const AddModelForm = ({ providerId, onClose }: AddModelFormProps) => {
  const [name, setName] = useState("");
  const [model, setModel] = useState("");

  return (
    <form className="space-y-6">
      <h2 className="text-xl font-semibold">Add Model</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <input
            type="text"
            className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300 transition-colors"
            onClick={() => {
              addModel({
                name,
                model,
                providerId,
              }).then(onClose);
            }}
          >
            Add Model
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

type EditModelFormProps = {
  selectedModel: StoredModel;
  onClose: () => void;
};
const EditModelForm = ({ selectedModel, onClose }: EditModelFormProps) => {
  const [name, setName] = useState(selectedModel.name);
  const [model, setModel] = useState(selectedModel.model);

  useEffect(() => {
    setName(selectedModel.name);
    setModel(selectedModel.model);
  }, [selectedModel]);

  return (
    <form className="space-y-6">
      <h2 className="text-xl font-semibold">Edit Model ({selectedModel.id})</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <input
            type="text"
            className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300 transition-colors"
            onClick={() => {
              updateModel(selectedModel.id, {
                name,
                model,
              }).then(onClose);
            }}
          >
            Update Model
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

const NoForm = () => <div className="text-center">No form selected</div>;

const SomethingHasGoneWrong = ({ formState }: { formState: FormState }) => (
  <div>
    <p>
      Something has gone horribly wrong with our form state. This should not
      have happened.
    </p>
    <code>{JSON.stringify(formState, null, 2)}</code>
  </div>
);

const ModelProviderManagerForm = ({
  formState,
  onClose,
  providers,
}: {
  formState: FormState;
  onClose: () => void;
  providers: ProviderWithModels[];
}) => {
  if (formState.state === "none") {
    return <NoForm />;
  } else if (formState.state === "new-provider") {
    return <AddProviderForm onClose={onClose} />;
  } else if (formState.state === "edit-provider" && formState.providerId) {
    const selectedProvider = providers.find(
      (p) => p.id === formState.providerId
    );
    if (!selectedProvider) {
      return <SomethingHasGoneWrong formState={formState} />;
    }
    return (
      <EditProviderForm selectedProvider={selectedProvider} onClose={onClose} />
    );
  } else if (formState.state === "new-model" && formState.providerId) {
    return <AddModelForm providerId={formState.providerId} onClose={onClose} />;
  } else if (formState.state === "edit-model") {
    const selectedModel = providers
      .map((p) => p.models)
      .flat()
      .find((m) => m.id === formState.modelId);
    if (!selectedModel) {
      return <SomethingHasGoneWrong formState={formState} />;
    }
    return <EditModelForm selectedModel={selectedModel} onClose={onClose} />;
  } else {
    return <SomethingHasGoneWrong formState={formState} />;
  }
};

type ProviderProps = {
  provider: ProviderWithModels;
  setFormState: (state: FormState) => void;
  deleteProvider: (providerId: number) => void;
};
const Provider = ({
  provider,
  setFormState,
  deleteProvider,
}: ProviderProps) => (
  <div>
    <div className="flex flex-row items-center border-b-2 border-slate-200 mb-2 mt-4">
      <div className="flex-grow font-bold">{provider.name}</div>
      {/* edit and delete buttons */}
      <button
        onClick={() =>
          setFormState({ state: "edit-provider", providerId: provider.id })
        }
        className="p-2 hover:bg-slate-200 rounded-md"
      >
        Edit
      </button>
      <button
        onClick={() => deleteProvider(provider.id)}
        className="p-2 hover:bg-red-100 text-red-600 rounded-md"
      >
        Delete
      </button>
    </div>
    <div>
      {provider.models.map((model) => (
        <div key={model.id} className="flex flex-row items-center">
          <button
            className="px-2 py-1 hover:bg-slate-200 rounded-md w-full text-left"
            onClick={() =>
              setFormState({ state: "edit-model", modelId: model.id })
            }
          >
            {model.name}
          </button>
        </div>
      ))}
      <div>
        <button
          onClick={() =>
            setFormState({ state: "new-model", providerId: provider.id })
          }
          className="px-2 hover:bg-slate-200 rounded-md w-full text-center"
        >
          +
        </button>
      </div>
    </div>
  </div>
);

type FormState = {
  state: "new-provider" | "edit-provider" | "new-model" | "edit-model" | "none";
  modelId?: number;
  providerId?: number;
};

type ModelProviderManagerProps = {
  open: boolean;
};
export const ModelProviderManager = ({ open }: ModelProviderManagerProps) => {
  const [formState, setFormState] = useState<FormState>({ state: "none" });
  const [providers, setProviders] = useState<ProviderWithModels[]>([]);

  const refreshProviders = () => {
    getAll().then((providers) => {
      setProviders(providers);
    });
  };

  useEffect(() => {
    refreshProviders();
  }, []);

  return (
    <div
      className="absolute inset-0 bg-white items-center justify-center px-6 flex h-full"
      style={{
        opacity: open ? "1" : "0",
        transform: open ? "translateX(0)" : "translateX(5%)",
        pointerEvents: open ? "auto" : "none",
        transition: "all 0.15s ease-in-out",
      }}
    >
      {/* Left Side - List */}
      <div className="w-1/3 min-h-full max-h-full border-r border-slate-200 py-6 pr-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Model Providers</h2>
          <button
            onClick={() => setFormState({ state: "new-provider" })}
            className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300 transition-colors"
          >
            +
          </button>
        </div>

        {/* Providers List */}
        <div className="space-y-2">
          {providers.map((provider) => (
            <Provider
              key={provider.id}
              provider={provider}
              setFormState={setFormState}
              deleteProvider={(providerId) => {
                removeProvider(providerId).then(() => {
                  refreshProviders();
                });
              }}
            />
          ))}
        </div>
      </div>

      {/* Right Side - Forms */}
      <div className="w-2/3 pl-6 pt-2 min-h-full">
        <ModelProviderManagerForm
          providers={providers}
          formState={formState}
          onClose={() => {
            setFormState({ state: "none" });
            refreshProviders();
          }}
        />
      </div>
    </div>
  );
};

export default ModelProviderManager;
