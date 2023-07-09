import { useThree } from "@react-three/fiber";
import { RefObject } from "react";
import { Group } from "three";

import { useCollisionsManager } from "../../../collisions/use-collisions-manager";
import { useMML } from "../../../hooks/use-mml";

export const MMLScene = (props: { mainGroupRef: RefObject<Group> }) => {
  const { mainGroupRef } = props;
  const { scene, camera, gl: renderer } = useThree();
  const { collisionsManager } = useCollisionsManager();
  useMML(mainGroupRef, renderer, scene, camera, collisionsManager);
  return null;
};
