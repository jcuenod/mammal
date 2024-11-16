import { useContext, useEffect, useState } from "react";
import { ModelProviderContext } from "../state/modelProviderContext";

type MenuOption = {
  id: number;
  label: string;
  onClick: () => void;
};

const MenuOption = ({ label, onClick }: MenuOption) => (
  <a
    className="w-full px-4 py-2 text-left hover:bg-slate-300 active:bg-slate-400"
    onClick={onClick}
  >
    {label}
  </a>
);

type DropdownProps = {
  selectedOptionIndex: number;
  menuOptions: MenuOption[];
};
const Dropdown = ({ selectedOptionIndex, menuOptions }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative mx-2 text-sm group">
      <button
        onClick={() => setIsOpen(!isOpen)}
        // we need setTimeout here to allow the event to fire on the submenu
        onBlur={() => setTimeout(() => setIsOpen(false), 300)}
        className="flex items-center h-10 px-4 rounded hover:bg-slate-300 active:bg-slate-400"
      >
        <div>{menuOptions[selectedOptionIndex]?.label || "Select"}</div>
      </button>
      <div
        className="absolute right-0 flex flex-col items-start min-w-40 rounded-md mt-1 p-1 border-2 border-slate-200 bg-white shadow-lg"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "all 120ms ease-in-out",
          transform: isOpen ? "translateY(0)" : "translateY(10px)",
        }}
      >
        {menuOptions.map((option) => (
          <MenuOption
            key={option.label + "_" + option.id}
            {...option}
            onClick={() => {
              setIsOpen(false);
              option.onClick();
            }}
          />
        ))}
      </div>
    </div>
  );
};

// const IconDropdown = () => (
//   <button className="relative ml-2 text-sm focus:outline-none group">
//     <div className="flex items-center rounded hover:bg-slate-300">
//       <div>Something</div>
//       <div className="flex items-center justify-between w-10 h-10">
//         <svg
//           className="w-5 h-5 mx-auto"
//           xmlns="http://www.w3.org/2000/svg"
//           fill="none"
//           viewBox="0 0 24 24"
//           stroke="currentColor"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth="2"
//             d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
//           />
//         </svg>
//       </div>
//     </div>
//     <div className="absolute right-0 flex-col items-start hidden w-40 pb-1 bg-white border border-slate-300 shadow-lg group-focus:flex">
//       <a className="w-full px-4 py-2 text-left hover:bg-slate-300" href="#">
//         Menu Item 1
//       </a>
//       <a className="w-full px-4 py-2 text-left hover:bg-slate-300" href="#">
//         Menu Item 1
//       </a>
//       <a className="w-full px-4 py-2 text-left hover:bg-slate-300" href="#">
//         Menu Item 1
//       </a>
//     </div>
//   </button>
// );

type NavbarProps = {
  selectedProviderId: number;
  selectedModelId: number;
  selectProvider: (selectedProviderId: number) => void;
  selectModel: (selectedModelId: number) => void;
};
export const Navbar = ({
  selectedProviderId,
  selectedModelId,
  selectProvider,
  selectModel,
}: NavbarProps) => {
  const { providers } = useContext(ModelProviderContext);

  const providerOptions = providers.map((provider) => ({
    id: provider.id,
    label: provider.name,
    onClick: () => {
      selectProvider(provider.id);
    },
  }));

  const modelOptions = providers
    .find((p) => p.id === selectedProviderId)
    ?.models.map((model) => ({
      id: model.id,
      label: model.name,
      onClick: () => {
        selectModel(model.id);
      },
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
    modelSelection.push(
      <div key="no-providers">
        No providers available (add one in the sidebar)
      </div>
    );
  } else {
    modelSelection.push(
      <Dropdown
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
        "//",
        <Dropdown
          key="modelDropdown"
          selectedOptionIndex={selectedModelIndex}
          menuOptions={modelOptions || []}
        />
      );
    } else {
      modelSelection.push(<div key="no-models">No models available</div>);
    }
  }

  return (
    <div className="flex items-center flex-shrink-0 h-16 border-b border-slate-300">
      {/* <h1 className="text-lg font-medium">Page Title</h1>
      <button className="flex items-center justify-center h-10 px-4 ml-auto text-sm font-medium rounded hover:bg-slate-300">
        Action 1
      </button>
      <button className="flex items-center justify-center h-10 px-4 ml-2 text-sm font-medium bg-slate-200 rounded hover:bg-slate-300">
        Action 2
      </button> */}
      {modelSelection}
    </div>
  );
};
