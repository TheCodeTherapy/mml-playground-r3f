import { RefObject, useEffect, useRef, useState } from "react";
import { Group } from "three";

import { useCollisionsManager } from "../../../collisions/use-collisions-manager";
import { Character } from "../character/character";
import { RemoteCharacters } from "../character/remote-characters";
import { MMLScene } from "../mml/mml-scene";

import { Floor } from "./floor";

export const World = (_props: { mainGroupRef: RefObject<Group> }) => {
  const worldGroupRef = useRef<Group>(null);
  const { collisionsManager } = useCollisionsManager();
  const [children, setChildren] = useState<number>(0);

  useEffect(() => {
    if (worldGroupRef.current) {
      collisionsManager.addMeshesGroup(worldGroupRef.current);
    }
  }, [collisionsManager]);

  useEffect(() => {
    if (worldGroupRef.current) {
      if (worldGroupRef.current.children.length !== children) {
        collisionsManager.removeMeshesGroup(worldGroupRef.current);
        setChildren(worldGroupRef.current?.children.length);
        collisionsManager.addMeshesGroup(worldGroupRef.current);
      }
    }
  }, [children, collisionsManager, worldGroupRef.current?.children.length]);

  return (
    <>
      <MMLScene mainGroupRef={_props.mainGroupRef} />
      <group ref={worldGroupRef} position={[0, 0, 0]}>
        <Floor />
      </group>
      <Character isLocal={true} />
      <RemoteCharacters />
    </>
  );
};
