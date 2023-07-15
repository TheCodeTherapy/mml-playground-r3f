import { useFrame } from "@react-three/fiber";
import { useState, useRef } from "react";
import { Quaternion, Group } from "three";

import { useNetwork } from "../../../network/use-network";

import { CharacterAnimationState } from "./character-store";

interface CharacterControllerRemoteProps {
  children: (characterState: CharacterAnimationState) => React.ReactNode;
  clientId: number;
}

export const CharacterControllerRemote: React.FunctionComponent<CharacterControllerRemoteProps> = ({
  children,
  clientId,
}) => {
  const characterRef = useRef<Group | null>(null);
  const [characterState, setCharacterState] = useState<CharacterAnimationState>("idle");

  const { clientUpdates } = useNetwork();

  const lerpFactor = 0.2;

  useFrame(() => {
    const clientUpdate = clientUpdates.get(clientId);
    if (clientUpdate && characterRef.current) {
      const targetPosition = clientUpdate.position;
      const currentPosition = characterRef.current.position;
      currentPosition.lerp(targetPosition, lerpFactor);

      const targetRotation = new Quaternion(0, clientUpdate.rotation.x, 0, clientUpdate.rotation.y);
      const currentRotation = characterRef.current.quaternion;
      currentRotation.slerp(targetRotation, lerpFactor);

      setCharacterState(clientUpdate.state as CharacterAnimationState);
    }
  });

  return <group ref={characterRef}>{children(characterState)}</group>;
};
