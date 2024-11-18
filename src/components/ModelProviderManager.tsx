import { useContext, useEffect, useState } from "react";
import {
  // getProviders,
  addProvider,
  removeProvider,
  updateProvider,
  // getModels,
  addModel,
  // removeModel,
  updateModel,
  // getAll,
} from "../state/modelProviders";
import type {
  ProviderWithModels,
  StoredModel,
  StoredProvider,
} from "../state/modelProviderContext";
import { knownProviders } from "../fixtures/knownProviders";
import { ModelProviderContext } from "../state/modelProviderContext";
import { EditIcon, PlusIcon, XIcon } from "./Icons";

type addProviderHelperFunction = (
  provider: {
    name: string;
    endpoint: string;
    apiKey: string;
  },
  models: { name: string; model: string }[]
) => void;
const addProviderHelper: addProviderHelperFunction = async (
  provider,
  models
) => {
  const providerId = await addProvider(provider);
  models.map((model) => {
    addModel({
      name: model.name,
      model: model.model,
      providerId,
    });
  });
};

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
            className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300 transition-colors active:bg-slate-400"
            onClick={async () => {
              const providerToUse = knownProviders.find(
                (p) => p.name === knownProvider
              );
              const nameToUse = providerToUse ? providerToUse.name : name;
              const endpointToUse = providerToUse
                ? providerToUse.endpoint
                : endpoint;
              const provider = {
                name: nameToUse,
                endpoint: endpointToUse,
                apiKey,
              };
              addProviderHelper(provider, providerToUse?.models || []);
              onClose();
            }}
          >
            Add Provider
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors active:bg-slate-100"
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
            className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300 transition-colors active:bg-slate-400"
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
            className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors active:bg-slate-100"
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
            className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300 transition-colors active:bg-slate-400"
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
            className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors active:bg-slate-100"
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
      <h2 className="text-xl font-semibold">Edit Model</h2>
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
            className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300 transition-colors active:bg-slate-400"
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
            className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors active:bg-slate-100"
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
    <div className="flex flex-row items-center border-b-2 border-slate-200 mb-2 pb-1 mt-4">
      <div className="flex-grow font-bold ml-2">{provider.name}</div>
      {/* edit and delete buttons */}
      <button
        onClick={() =>
          setFormState({ state: "edit-provider", providerId: provider.id })
        }
        className="p-2 hover:bg-slate-200 rounded-md active:scale-95"
      >
        <EditIcon className={"w-4 h-4"} />
      </button>
      <button
        onClick={() => deleteProvider(provider.id)}
        className="p-2 hover:bg-red-100 text-red-600 rounded-md active:scale-95"
      >
        <XIcon className={"w-4 h-4"} />
      </button>
    </div>
    <div>
      {provider.models.map((model) => (
        <div key={model.id} className="flex flex-row items-center">
          <button
            className="p-2 hover:bg-slate-200 rounded-md w-full text-left active:bg-slate-300"
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
          className="p-2 hover:bg-slate-200 rounded-md w-full flex items-center justify-center active:bg-slate-300"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="pl-2">Add New Model</span>
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
  const { providers, refresh } = useContext(ModelProviderContext);

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
            className="p-2 bg-slate-100 rounded-md hover:bg-slate-300 active:scale-95 transition-colors"
          >
            <PlusIcon className="w-6 h-6" />
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
                  refresh();
                });
              }}
            />
          ))}
        </div>
      </div>

      {/* Right Side - Forms */}
      <div className="w-2/3 pl-6 py-6 overflow-auto min-h-full">
        <ModelProviderManagerForm
          providers={providers}
          formState={formState}
          onClose={() => {
            setFormState({ state: "none" });
            // We need setTimeout here because addProvider crashes when
            // there are callbacks dependent on awaiting the async db update
            // (evidently a bug in tauri's sqlite plugin...)
            setTimeout(refresh, 50);
          }}
        />
      </div>
    </div>
  );
};

export default ModelProviderManager;
