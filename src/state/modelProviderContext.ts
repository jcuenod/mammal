import { createContext } from "react";
import { ProviderWithModels } from "./modelProviders";

type ModelProviderContext = {
  refresh: () => void;
  providers: ProviderWithModels[];
};
export const ModelProviderContext = createContext<ModelProviderContext>({
  refresh: () => {},
  providers: [],
});
