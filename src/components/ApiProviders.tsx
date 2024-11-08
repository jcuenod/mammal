import { useState } from "react";

export type Provider = {
  id: string;
  name: string;
  url: string;
  models?: string[];
  apiKey?: string;
};

type ApiProvidersState = "new" | "edit";

type ApiProvidersProps = {
  open: boolean;
  onClose: () => void;
  providers: Provider[];
  onAddProvider: (provider: Provider) => void;
  onRemoveProvider: (providerId: string) => void;
  onUpdateProvider: (provider: Provider) => void;
};

export const ApiProviders = ({
  open,
  onClose,
  providers,
  onAddProvider,
  onRemoveProvider,
  onUpdateProvider,
}: ApiProvidersProps) => {
  const [_selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null
  );
  const [formType, setFormType] = useState<ApiProvidersState>("new");

  const knownProviders = [
    { id: "openai", name: "OpenAI", url: "https://api.openai.com/v1" },
    { id: "anthropic", name: "Anthropic", url: "https://api.anthropic.com" },
    { id: "ollama", name: "Ollama", url: "http://localhost:11434/api" },
    { id: "custom", name: "Custom Provider", url: "" },
    { id: "groq", name: "Groq", url: "https://api.groq.com" },
    { id: "cerebras", name: "Cerebras", url: "https://api.cerebras.net" },
  ];

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    url: "",
    models: "",
    apiKey: "",
  });

  const handleProviderSelect = (providerId: string) => {
    const template = knownProviders.find((p) => p.id === providerId);
    if (template) {
      setFormData({
        id: template.id,
        name: template.name,
        url: template.url,
        models: "",
        apiKey: "",
      });
    }
  };

  return open ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white w-[90%] max-w-4xl rounded-lg p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl">Configure API Providers</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="flex gap-8">
          {/* Left side - Configured Providers */}
          <div className="flex-1">
            <h3 className="text-xl mb-4">Configured Providers</h3>
            <ul className="space-y-4">
              {providers.map((provider) => (
                <li
                  key={provider.id}
                  className="flex items-center justify-between p-2 bg-slate-100 rounded hover:bg-slate-200 cursor-pointer"
                  onClick={() => {
                    setSelectedProvider(provider);
                    setFormType("edit");
                    setFormData({
                      id: provider.id,
                      name: provider.name,
                      url: provider.url,
                      models: provider.models?.join(",") || "",
                      apiKey: provider.apiKey || "",
                    });
                  }}
                >
                  <div>
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-sm text-gray-600">{provider.url}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveProvider(provider.id);
                    }}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                setFormType("new");
                setSelectedProvider(null);
                setFormData({
                  id: "",
                  name: "",
                  url: "",
                  models: "",
                  apiKey: "",
                });
              }}
              className="mt-4 w-full py-2 bg-slate-200 rounded hover:bg-slate-300"
            >
              Add New Provider
            </button>
          </div>

          {/* Right side - Provider Form */}
          <div className="flex-1">
            <h3 className="text-xl mb-4">
              {formType === "edit" ? "Edit Provider" : "New Provider"}
            </h3>
            <select
              className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-slate-200"
              onChange={(e) => handleProviderSelect(e.target.value)}
              value={formData.id}
            >
              <option value="">Select a provider...</option>
              {knownProviders.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>

            {(formData.id === "custom" || formType === "edit") && (
              <>
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
                <input
                  type="text"
                  placeholder="URL"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </>
            )}
            <input
              type="text"
              placeholder="Models (comma-separated)"
              value={formData.models}
              onChange={(e) =>
                setFormData({ ...formData, models: e.target.value })
              }
              className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
            <input
              type="password"
              placeholder="API Key"
              value={formData.apiKey}
              onChange={(e) =>
                setFormData({ ...formData, apiKey: e.target.value })
              }
              className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
            <button
              onClick={() => {
                const provider = {
                  id: crypto.randomUUID(),
                  name: formData.name,
                  url: formData.url,
                  models: formData.models
                    .split(",")
                    .map((m) => m.trim())
                    .filter(Boolean),
                  apiKey: formData.apiKey,
                };
                if (formType === "edit") {
                  onUpdateProvider(provider);
                } else {
                  onAddProvider(provider);
                }
                setFormData({
                  id: "",
                  name: "",
                  url: "",
                  models: "",
                  apiKey: "",
                });
              }}
              className="w-full py-2 bg-slate-200 rounded hover:bg-slate-300"
            >
              {formType === "edit" ? "Update Provider" : "Add Provider"}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};
