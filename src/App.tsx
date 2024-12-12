import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Content } from "./views/Content";
import { ModelProviderManager } from "./views/ModelProviderManager";
import { defaultState } from "./components/mainViewState";
import type { mainViewState } from "./components/mainViewState";
import ModelProviderContextWrapper from "./state/modelProviders";
import MessageProviderContextWrapper from "./state/message";
import "./App.css";
import ModelSettingsContextWrapper from "./state/modelSettings";
import { DropHandler } from "./components/DropHandler";
import DropReadyContextWrapper from "./state/dropReadyContextProvider";

function App() {
  const [modalState, setModalState] = useState<mainViewState>(defaultState);
  const [hasProviders, setHasProviders] = useState(true);

  const setModalStateAndCheckProviders = (state: mainViewState) => {
    if (hasProviders) {
      setModalState(state);
      return;
    }
    alert("Please add a provider first.");
  };

  useEffect(() => {
    if (hasProviders) return;
    setModalState("add-provider");
  }, [hasProviders]);

  return (
    <MessageProviderContextWrapper>
      <ModelProviderContextWrapper setHasProviders={setHasProviders}>
        <ModelSettingsContextWrapper>
          <DropReadyContextWrapper>
            <div className="flex w-screen h-screen text-slate-700">
              <div className="flex flex-col items-center w-16 min-w-16 pb-4 overflow-auto border-r border-slate-300">
                <Sidebar
                  state={modalState}
                  setSidebarState={setModalStateAndCheckProviders}
                />
              </div>
              <div className="flex flex-row w-full relative overflow-hidden">
                <Content />
                <ModelProviderManager open={modalState === "add-provider"} />
              </div>
            </div>
            <DropHandler />
          </DropReadyContextWrapper>
        </ModelSettingsContextWrapper>
      </ModelProviderContextWrapper>
    </MessageProviderContextWrapper>
  );
}

export default App;
