import React, { useMemo } from "react";
import { Scene } from "three";

import { CollisionsManagerContext } from "./collisions-context";
import { CollisionsManager } from "./collisions-manager";

interface CollisionsManagerProviderProps {
  children: React.ReactNode;
  scene: Scene;
}

export function CollisionsManagerProvider({ children, scene }: CollisionsManagerProviderProps) {
  const collisionsManager = useMemo(() => new CollisionsManager(scene), [scene]);
  const colliders = useMemo(() => collisionsManager.colliders, [collisionsManager.colliders]);

  return (
    <CollisionsManagerContext.Provider
      value={{
        collisionsManager: collisionsManager,
        colliders: colliders,
      }}
    >
      {children}
    </CollisionsManagerContext.Provider>
  );
}
