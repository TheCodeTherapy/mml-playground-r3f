import { Html } from "@react-three/drei";
import { PrimitiveProps, useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect, FC, useState, useCallback } from "react";
import { AnimationAction, DataTexture, LoopRepeat, Texture } from "three";

import { useTime } from "../../../hooks/use-time";
import { useToggle } from "../../../hooks/use-toggle";

import { CHAR_STORE, CharacterAnimationState, CharacterStore, type CharacterAnimatorProps } from "./character-store";

export const CharacterModel: FC<CharacterAnimatorProps> = ({
  characterState,
  transitionDuration = 0.15,
  isLocal = true,
  id,
}) => {
  const useIdTag: boolean = useToggle(false, "p");
  const [characterStore] = useState(() => (isLocal ? CHAR_STORE : new CharacterStore()));
  const characterModelRef = useRef<PrimitiveProps | null>(null);
  const time = useTime();
  const { scene } = useThree();

  const transitionToAnimation = useCallback(
    (targetAnimation: CharacterAnimationState, duration: number): void => {
      const currentAction: AnimationAction = characterStore.currentAnimationAction!;
      const targetAction: AnimationAction = characterStore.getAnimationAction(targetAnimation)!;
      if (!targetAction.isRunning()) targetAction.play();
      if (targetAnimation === characterStore.currentAnimationState) return;

      if (currentAction && targetAction) {
        currentAction.enabled = true;
        targetAction.enabled = true;
        targetAction.setLoop(LoopRepeat, Infinity);
        currentAction.crossFadeTo(targetAction, duration, true);
        characterStore.setCurrentAnimationAction(targetAction);
        characterStore.setCurrentAnimationState(targetAnimation);
      }
    },
    [characterStore]
  );

  useEffect(() => {
    if (characterStore.modelLoaded && characterStore.mixer) {
      const duration = transitionDuration;
      transitionToAnimation(characterState, duration);
    }
  }, [characterState, characterStore.mixer, characterStore.modelLoaded, transitionDuration, transitionToAnimation]);

  useFrame(() => {
    if (characterStore.modelLoaded && characterStore.mixer) {
      const dt = time.smoothDelta > time.delta * 1.75 ? time.delta : time.smoothDelta;
      characterStore.mixer.update(dt);
      if (scene.background && scene.background instanceof DataTexture) {
        characterStore.updateMaterialUniforms(time.time, id, scene.background as Texture);
      } else {
        characterStore.updateMaterialUniforms(time.time, id);
      }
    }
  });

  return (
    <>
      {characterStore.modelLoaded === true && characterStore.model !== null && (
        <>
          <primitive ref={characterModelRef} object={characterStore.model} />
          {useIdTag && (
            <Html position={[0, 2.2, 0]}>
              <div
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  padding: "3px 12px",
                  borderRadius: "7px",
                  transform: "translateX(-50%)",
                }}
              >
                {id}
              </div>
            </Html>
          )}
        </>
      )}
    </>
  );
};
