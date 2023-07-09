import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect, useCallback, useState } from "react";
import { PerspectiveCamera, Vector3 } from "three";

import { clamp, ease, remap } from "../../../helpers/math-helpers";
import { CHAR_STORE } from "../character/character-store";

export function CameraManager() {
  const { camera } = useThree();

  const initialCamDistance: number = 3;

  const dampingFactor = 0.075;
  const minDistance = 0;
  const maxDistance = 8;
  const minFOV = 79;
  const maxFOV = 84;
  const minPolarAngle = Math.PI * 0.25;
  const maxPolarAngle = Math.PI * 0.95;

  const initialFOV: number = (camera as PerspectiveCamera).fov;
  const fov = useRef<number>(initialFOV);
  const [targetFOV, setTargetFOV] = useState<number>(initialFOV);

  const targetPosition = useRef(new Vector3());
  const targetTheta = useRef(Math.PI / 2);
  const targetPhi = useRef(Math.PI / 2);
  const targetDistance = useRef(initialCamDistance);

  const theta = useRef(targetTheta.current);
  const phi = useRef(targetPhi.current);
  const distance = useRef(targetDistance.current);

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!CHAR_STORE.modelHeadPosition || !distance.current) return;
      targetTheta.current += event.movementX * 0.01;
      targetPhi.current -= event.movementY * 0.01;
      targetPhi.current = Math.max(minPolarAngle, Math.min(maxPolarAngle, targetPhi.current));
    },
    [maxPolarAngle, minPolarAngle]
  );

  const onMouseUp = useCallback(() => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  const onMouseWheel = useCallback((event: WheelEvent) => {
    const scrollAmount = event.deltaY * 0.005;
    targetDistance.current += scrollAmount;
    targetDistance.current = Math.max(minDistance, Math.min(maxDistance, targetDistance.current));
  }, []);

  const onMouseDown = useCallback(
    (event: MouseEvent) => {
      if (event.button === 0) {
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      }
    },
    [onMouseMove, onMouseUp]
  );

  useEffect(() => {
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("wheel", onMouseWheel);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("wheel", onMouseWheel);
    };
  }, [onMouseDown, onMouseMove, onMouseUp, onMouseWheel]);

  useFrame(() => {
    if (!CHAR_STORE.modelHeadPosition) return;

    targetPosition.current.copy(CHAR_STORE.modelHeadPosition);

    distance.current += (targetDistance.current - distance.current) * dampingFactor * 0.21;
    phi.current += (targetPhi.current - phi.current) * dampingFactor;
    theta.current += (targetTheta.current - theta.current) * dampingFactor;

    const x = targetPosition.current.x + distance.current * Math.sin(phi.current) * Math.cos(theta.current);
    const y = targetPosition.current.y + distance.current * Math.cos(phi.current);
    const z = targetPosition.current.z + distance.current * Math.sin(phi.current) * Math.sin(theta.current);

    setTargetFOV(remap(targetDistance.current, minDistance, maxDistance, minFOV, maxFOV));
    fov.current += ease(targetFOV, fov.current, 0.07);
    const cam = camera as PerspectiveCamera;
    cam.fov = fov.current;
    cam.updateProjectionMatrix();

    camera.position.set(x, clamp(y, 0.1, Infinity), z);
    camera.lookAt(targetPosition.current);
  });

  return null;
}
