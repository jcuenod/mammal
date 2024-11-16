import { useState } from "react";
import { SecondarySidebar } from "./components/SecondarySidebar";
import { Sidebar } from "./components/Sidebar";
import { Content } from "./components/Content";
import { ModelProviderManager } from "./components/ModelProviderManager";
import { defaultState } from "./components/mainViewState";
import type { mainViewState } from "./components/mainViewState";
import ModelProviderContextWrapper from "./state/modelProviders";
import MessageProviderContextWrapper from "./state/message";
import "./App.css";

function App() {
  const [modalState, setModalState] = useState<mainViewState>(defaultState);

  return (
    <MessageProviderContextWrapper>
      <ModelProviderContextWrapper>
        <div className="flex w-screen h-screen text-slate-700">
          <div className="flex flex-col items-center w-16 min-w-16 pb-4 overflow-auto border-r border-slate-300">
            <Sidebar state={modalState} setSidebarState={setModalState} />
          </div>
          <div className="flex flex-row w-full relative overflow-hidden">
            <div className="flex flex-col w-80 min-w-80 border-r border-slate-300">
              <SecondarySidebar />
            </div>
            <Content />
            <ModelProviderManager open={modalState === "add-provider"} />
          </div>
        </div>
      </ModelProviderContextWrapper>
    </MessageProviderContextWrapper>
  );
}

export default App;
