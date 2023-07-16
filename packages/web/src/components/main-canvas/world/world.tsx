import { PositionAndRotation } from "mml-web";
import { RefObject, useEffect, useRef, useState } from "react";
import { Euler, Group, Object3D, Quaternion, Vector3 } from "three";

import { useCollisionsManager } from "../../../collisions/use-collisions-manager";
import { Character } from "../character/character";
import { RemoteCharacters } from "../character/remote-characters";
import { MMLScene } from "../mml/mml-scene";

import { Floor } from "./floor";

export type CharacterPositionAndRotation = {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
};

export const World = (_props: { mainGroupRef: RefObject<Group> }) => {
  const worldGroupRef = useRef<Group>(null);
  const { collisionsManager } = useCollisionsManager();
  const [children, setChildren] = useState<number>(0);
  const characterObject3DRef = useRef<Object3D>(null);

  const getCharacterPositionAndRotation = (): PositionAndRotation => {
    if (characterObject3DRef.current) {
      characterObject3DRef.current.updateMatrixWorld();
      const worldQuaternion = new Quaternion();
      characterObject3DRef.current.getWorldQuaternion(worldQuaternion);

      const worldRotation = new Euler().setFromQuaternion(worldQuaternion, "XYZ");
      return {
        position: characterObject3DRef.current.getWorldPosition(new Vector3()),
        rotation: worldRotation,
      };
    }
    return {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    };
  };

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
      <MMLScene
        mainGroupRef={_props.mainGroupRef}
        characterObject3DRef={characterObject3DRef}
        getCharacterPositionAndRotation={getCharacterPositionAndRotation}
      />
      <group ref={worldGroupRef} position={[0, 0, 0]}>
        <Floor />
      </group>
      <Character isLocal={true} characterObject3DRef={characterObject3DRef} />
      <RemoteCharacters />
    </>
  );
};
