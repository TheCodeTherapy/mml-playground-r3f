import { Environment } from "@react-three/drei";

import { SceneFog } from "./scene-fog";
import { SunLight } from "./scene-sun";

export const SceneEnvironment = () => {
  const hdrUrl = "/assets/hdr/industrial_sunset.hdr";

  return (
    <>
      <ambientLight intensity={0.05} />
      <Environment files={hdrUrl} resolution={1024} background />
      <SunLight />
      <SceneFog />
    </>
  );
};
