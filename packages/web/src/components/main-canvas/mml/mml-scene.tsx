import { useThree } from "@react-three/fiber";
import { PositionAndRotation } from "mml-web";
import { RefObject } from "react";
import { Group, Object3D } from "three";

import { useCollisionsManager } from "../../../collisions/use-collisions-manager";
import { useMML } from "../../../hooks/use-mml";

export const MMLScene = (props: {
  mainGroupRef: RefObject<Group>;
  characterObject3DRef: RefObject<Object3D>;
  getCharacterPositionAndRotation: () => PositionAndRotation;
}) => {
  const { mainGroupRef, getCharacterPositionAndRotation } = props;
  const { scene, camera, gl: renderer } = useThree();
  const { collisionsManager } = useCollisionsManager();
  useMML(mainGroupRef, renderer, scene, camera, collisionsManager, getCharacterPositionAndRotation);
  return null;
};
