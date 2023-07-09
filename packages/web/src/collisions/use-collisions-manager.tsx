import { useContext } from "react";

import { CollisionsManagerContext } from "./collisions-context";

export function useCollisionsManager() {
  const context = useContext(CollisionsManagerContext);
  if (context === null) {
    throw new Error("useCollisionsManager must be used within a CollisionsManagerProvider");
  }
  return context;
}
