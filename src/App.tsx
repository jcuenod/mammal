import { useState } from "react";
import "./App.css";
import { Navbar } from "./components/Navbar";
import { SecondarySidebar } from "./components/SecondarySidebar";
import { Sidebar } from "./components/Sidebar";
import { Content } from "./components/Content";
import { ModelProviderManager } from "./components/ModelProviderManager";
import { useMessageStore } from "./state/messages";
import { defaultState } from "./components/mainViewState";
import type { mainViewState } from "./components/mainViewState";

function App() {
  const { init } = useMessageStore();
  // @ts-ignore
  const _ = init();

  const [modalState, setModalState] = useState<mainViewState>(defaultState);
  // const [providers, setProviders] = useState<Provider[]>([]);

  return (
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
      {/* <ApiProviders
        open={modalState === "add-provider"}
        onClose={() => setModalState("none")}
        providers={providers}
        onAddProvider={(provider) => {
          setProviders([...providers, provider]);
          console.log(providers);
        }}
        onRemoveProvider={(providerId) => {
          setProviders(providers.filter((p) => p.id !== providerId));
        }}
        onUpdateProvider={(provider) => {
          setProviders(
            providers.map((p) => (p.id === provider.id ? provider : p))
          );
        }}
      /> */}
    </div>
  );
}

export default App;
