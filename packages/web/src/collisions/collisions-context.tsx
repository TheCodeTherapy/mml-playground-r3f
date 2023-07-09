import { createContext } from "react";
import { Group } from "three";

import { CollisionsManager } from "./collisions-manager";

interface CollisionsManagerContextData {
  collisionsManager: CollisionsManager;
  colliders: Group;
}

export const CollisionsManagerContext = createContext<CollisionsManagerContextData | null>(null);
