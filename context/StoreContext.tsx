import React, { createContext, useContext, useState, useEffect } from "react";
import { subscribeToStore } from "@/data/store";

const StoreContext = createContext<number>(0);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    return subscribeToStore(() => setRefresh((r) => r + 1));
  }, []);

  return (
    <StoreContext.Provider value={refresh}>{children}</StoreContext.Provider>
  );
}

export function useStoreRefresh(): number {
  return useContext(StoreContext);
}
