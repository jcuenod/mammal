// @ts-nocheck
import { shallow } from "zustand/shallow";

export function computed(depsFn, computeFn) {
  let prevDeps;
  let cachedResult;
  return () => {
    const deps = depsFn();
    if (prevDeps === undefined || !shallow(prevDeps, deps)) {
      prevDeps = deps;
      cachedResult = computeFn(...deps);
    }
    return cachedResult;
  };
}
