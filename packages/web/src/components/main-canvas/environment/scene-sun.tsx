// Assuming you already have these imports
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { DirectionalLight } from "three";

import { CHAR_STORE } from "../character/character-store";

export const SunLight = () => {
  const shadowCamFrustum = 25;
  const sunOffset = { x: 50, y: 80, z: 35 };

  const sunLightRef = useRef<DirectionalLight>(null);

  useFrame(() => {
    if (sunLightRef.current) {
      sunLightRef.current.position.set(
        CHAR_STORE.modelHeadPosition.x + sunOffset.x,
        CHAR_STORE.modelHeadPosition.y + sunOffset.y,
        CHAR_STORE.modelHeadPosition.z + sunOffset.z
      );
      sunLightRef.current.target.position.copy(CHAR_STORE.modelHeadPosition);
      sunLightRef.current.target.updateMatrixWorld();
    }
  });

  return (
    <directionalLight
      ref={sunLightRef}
      position={[sunOffset.x, sunOffset.y, sunOffset.z]}
      color={0xffffff}
      intensity={1}
      castShadow
      shadow-mapSize-width={8192}
      shadow-mapSize-height={8192}
      shadow-bias={-0.0000001}
      shadow-camera-left={-shadowCamFrustum}
      shadow-camera-right={shadowCamFrustum}
      shadow-camera-top={shadowCamFrustum}
      shadow-camera-bottom={-shadowCamFrustum}
      shadow-camera-near={0.5}
      shadow-camera-far={500}
    />
  );
};
