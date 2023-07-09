import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Clock } from "three";

import { ease } from "../helpers/math-helpers";

export const useTime = (): {
  delta: number;
  smoothDelta: number;
  time: number;
  frame: number;
} => {
  const maxAverageFrames = 300;
  const deltaTimes = useRef<number[]>([]);
  const clock = useRef(new Clock());
  const roundMag = 200000;

  const [targetAverageDelta, setTargetAverageDelta] = useState(0);
  const [lerpedAverageMagDelta, setLerpedAverageMagDelta] = useState(0);

  const [rawDelta, setRawDelta] = useState(0);
  const [smoothDelta, setSmoothDelta] = useState(0);
  const [time, setTime] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);

  useFrame((_state, delta) => {
    setRawDelta(delta);
    setCurrentFrame(currentFrame + 1);
    setTime(time + delta);
    const dt = clock.current.getDelta();
    deltaTimes.current.push(dt);
    if (deltaTimes.current.length > maxAverageFrames) {
      deltaTimes.current.shift();
    }
    setTargetAverageDelta(deltaTimes.current.reduce((prev, curr) => prev + curr, 0) / deltaTimes.current.length);
    setLerpedAverageMagDelta(lerpedAverageMagDelta + ease(targetAverageDelta * roundMag, lerpedAverageMagDelta, 0.12));
    const smoothDT = lerpedAverageMagDelta / roundMag;
    setSmoothDelta(Math.round(smoothDT * roundMag) / roundMag);
  });
  return {
    delta: rawDelta,
    smoothDelta: smoothDelta,
    time: time,
    frame: currentFrame,
  };
};
