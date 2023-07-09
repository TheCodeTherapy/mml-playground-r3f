import { useThree } from "@react-three/fiber";
import { RefObject } from "react";
import { Group } from "three";

import { CollisionsManagerProvider } from "../../../collisions/collisions-provider";

import { World } from "./world";

export const CollidableWorld = (_props: { mainGroupRef: RefObject<Group> }) => {
  const { scene } = useThree();
  return (
    <>
      <CollisionsManagerProvider scene={scene}>
        <World mainGroupRef={_props.mainGroupRef} />
      </CollisionsManagerProvider>
    </>
  );
};
