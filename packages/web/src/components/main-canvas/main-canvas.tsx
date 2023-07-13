import { RefObject } from "react";
import { type Group } from "three";

import { CameraManager } from "./camera/camera-manager";
import { SceneEnvironment } from "./environment/scene-environment";
import { PostProcessing } from "./post-processing/post-processing";
import { PerformanceMonitor } from "./visual-helpers/performance-monitor";
import { CollidableWorld } from "./world/collideable-world";

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
export function MainCanvas(_props: { mainGroupRef: RefObject<Group> }) {
  return (
    <>
      <CameraManager />
      <CollidableWorld mainGroupRef={_props.mainGroupRef} />
      <SceneEnvironment />
      <PostProcessing />
      <PerformanceMonitor showByDefault />
    </>
  );
}
