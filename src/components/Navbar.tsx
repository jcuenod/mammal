import { useContext, useEffect } from "react";
import { ModelProviderContext } from "../state/modelProviderContext";
import { ComboBox, IconMenu } from "./Dropdown";
import { PanelLeftCloseIcon, SettingsIcon } from "./Icons";
import { ModelSettingsContext } from "../state/modelSettingsContext";
import { ModelSettingsMenu } from "./ModelSettingsMenu";

const ToggleSidebarButton = ({
  toggleSidebar,
  isOpen,
}: {
  toggleSidebar: () => void;
  isOpen: boolean;
}) => {
  return (
    <button
      className="p-2 rounded-md hover:bg-slate-200 active:scale-95 relative"
      onClick={toggleSidebar}
    >
      <div className="w-6 h-6 relative">
        <PanelLeftCloseIcon
          className={`w-full h-full`}
          style={{
            opacity: isOpen ? 1 : 0,
            transform: `rotate(${isOpen ? 0 : 180}deg) scale(${
              isOpen ? 1 : 0.7
            })`,
            transition: "transform 300ms ease-in-out",
          }}
        />
        <PanelLeftCloseIcon
          className={`w-full h-full absolute top-0 left-0`}
          style={{
            opacity: isOpen ? 0 : 1,
            transform: `rotate(${isOpen ? 360 : 180}deg) scale(${
              isOpen ? 0.7 : 1
            })`,
            transition: "transform 300ms ease-in-out",
          }}
        />
      </div>
    </button>
  );
};

type NavbarProps = {
  selectedProviderId: number;
  selectedModelId: number;
  selectProvider: (selectedProviderId: number) => void;
  selectModel: (selectedModelId: number) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};
export const Navbar = ({
  selectedProviderId,
  selectedModelId,
  selectProvider,
  selectModel,
  sidebarOpen,
  toggleSidebar,
}: NavbarProps) => {
  const { providers } = useContext(ModelProviderContext);
  const { temperature, setTemperature, maxTokens, setMaxTokens } =
    useContext(ModelSettingsContext);

  const providerOptions = providers.map((provider) => ({
    id: provider.id,
    active: provider.id === selectedProviderId,
    label: provider.name,
    onClick: () => {
      selectProvider(provider.id);
    },
  }));

  const modelOptions = providers
    .find((p) => p.id === selectedProviderId)
    ?.models.map((model) => ({
      id: model.id,
      active: model.id === selectedModelId,
      label: model.name,
      onClick: () => selectModel(model.id),
    }));

  const selectedProviderIndex =
    providers.findIndex((provider) => provider.id === selectedProviderId) || 0;

  const selectedModelIndex =
    providers
      .find((p) => p.id === selectedProviderId)
      ?.models.findIndex((model) => model.id === selectedModelId) || 0;

  useEffect(() => {
    if (providers.length === 0) return;
    // TODO: get rid of this try-catch
    try {
      if (selectedProviderIndex === -1) {
        selectProvider(providers[0].id);
        selectModel(providers[0].models[0].id);
      } else if (selectedModelIndex === -1) {
        selectModel(providers[selectedProviderIndex].models[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }, [selectedProviderIndex, selectedModelIndex, providers]);

  const modelSelection = [];
  if (providerOptions.length === 0) {
    modelSelection.push(<div key="no-providers" className="p-4"></div>);
  } else {
    modelSelection.push(
      <ComboBox
        key="providerDropdown"
        selectedOptionIndex={selectedProviderIndex}
        menuOptions={providerOptions}
      />
    );
    if (
      selectedProviderIndex !== -1 &&
      modelOptions &&
      modelOptions.length > 0
    ) {
      modelSelection.push(
        <ComboBox
          key="modelDropdown"
          selectedOptionIndex={selectedModelIndex}
          menuOptions={modelOptions || []}
        />
      );
      modelSelection.push(
        <IconMenu key="iconMenu" icon={<SettingsIcon className="w-5 h-5" />}>
          <ModelSettingsMenu
            temperature={temperature}
            setTemperature={setTemperature}
            maxTokens={maxTokens}
            setMaxTokens={setMaxTokens}
          />
        </IconMenu>
      );
    } else {
      modelSelection.push(
        <div key="no-models" className="p-4">
          No models available
        </div>
      );
    }
  }

  return (
    <div className="flex items-center flex-shrink-0 p-4 bg-white border-b border-slate-300 text-slate-600 space-x-1">
      <ToggleSidebarButton toggleSidebar={toggleSidebar} isOpen={sidebarOpen} />
      {modelSelection}
    </div>
  );
};
