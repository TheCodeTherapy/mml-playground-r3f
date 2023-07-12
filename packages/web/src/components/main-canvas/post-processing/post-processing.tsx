import { Bloom, EffectComposer, SMAA, SSAO, HueSaturation, BrightnessContrast } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Suspense } from "react";
import { Color } from "three";

import { useToggle } from "../../../hooks/use-toggle";

export const PostProcessing = () => {
  const black: Color = new Color(0x000000);
  const useAdvancedPost: boolean = useToggle(true, "o");
  return (
    <Suspense fallback={null}>
      <EffectComposer multisampling={0}>
        <>
          {useAdvancedPost && (
            <>
              <Bloom luminanceThreshold={2} intensity={0.1} mipmapBlur />
              <SMAA />
              <SSAO
                samples={12}
                radius={0.23}
                intensity={7}
                luminanceInfluence={0.1}
                color={black}
                worldDistanceThreshold={100}
                worldDistanceFalloff={2}
                worldProximityThreshold={100}
                worldProximityFalloff={2}
              />
            </>
          )}
        </>
        <HueSaturation blendFunction={BlendFunction.NORMAL} saturation={0.0} />
        <BrightnessContrast brightness={-0.02} contrast={0.07} />
      </EffectComposer>
    </Suspense>
  );
};
