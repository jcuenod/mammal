import { invoke } from "@tauri-apps/api/core";
import { createContext, useEffect, useState } from "react";

type DropReadyContext = boolean;
export const DropReadyContext = createContext<DropReadyContext>(false);

const DropReadyContextWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isReadyForDrop, setIsReadyForDrop] = useState(false);

  useEffect(() => {
    (async () => {
      console.log("Initializing Pandoc...");
      await invoke("init_pandoc");
      console.log("Pandoc is ready!");
      setIsReadyForDrop(false);
    })();
  }, []);

  return (
    <DropReadyContext.Provider value={isReadyForDrop}>
      {children}
    </DropReadyContext.Provider>
  );
};
export default DropReadyContextWrapper;
