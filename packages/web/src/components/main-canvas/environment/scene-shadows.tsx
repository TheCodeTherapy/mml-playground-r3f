import { AccumulativeShadows, RandomizedLight } from "@react-three/drei";
import { memo } from "react";

const Shadow = () => (
  <AccumulativeShadows
    frames={30}
    color="#000000"
    scale={20}
    resolution={1024}
    colorBlend={2}
    toneMapped={true}
    alphaTest={0.8}
    opacity={1.1}
    position={[0, 0.01, 0]}
  >
    <RandomizedLight amount={3} radius={2} position={[11, 4, 8]} />
  </AccumulativeShadows>
);

const SceneShadowsFC = (props: { iterAmount: number }) => {
  const { iterAmount } = props;
  const shadowsArray = Array.from({ length: iterAmount }, (_, idx) => <Shadow key={`${_}-${idx}`} />);
  return <>{shadowsArray}</>;
};

export const SceneShadows = memo(SceneShadowsFC);
