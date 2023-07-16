import { type ClientUpdate } from "@mml-playground/character-network";
import { packetsUpdateRate } from "@mml-playground/character-network/src/character-network-settings";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import { Box3, Group, Line3, Matrix4, Quaternion, Raycaster, Vector2, Vector3 } from "three";

import { useCollisionsManager } from "../../../collisions/use-collisions-manager";
import { ease } from "../../../helpers/math-helpers";
import { useInputMapper } from "../../../hooks/use-input-mapper";
import { useTime } from "../../../hooks/use-time";
import { useNetwork } from "../../../network/use-network";

import { CharacterAnimationState } from "./character-store";

export const CharacterControllerLocal = ({
  children,
}: {
  children: (characterState: CharacterAnimationState) => JSX.Element;
}) => {
  const maxWalkSpeed = 6;
  const maxRunSpeed = 8.5;
  const gravity = -42;
  const jumpForce = 15;

  const vectorUp = new Vector3(0, 1, 0);
  const vectorDown = new Vector3(0, -1, 0);

  const oneFourthPI = Math.PI / 4;
  const halfPI = Math.PI / 2;
  const tau = Math.PI * 2;

  const { collisionsManager, colliders } = useCollisionsManager();

  const { camera } = useThree();
  const time = useTime();
  const { forward, backward, left, right, run, jump, anyDirection, conflictingDirection } = useInputMapper();

  const capsuleInfo = {
    radius: 0.5,
    segment: new Line3(new Vector3(), new Vector3(0, 1.0, 0)),
  };

  const rayCaster = useRef<Raycaster>(new Raycaster());

  const { id, sendUpdate } = useNetwork();
  const characterRef = useRef<Group | null>(null);
  const [characterState, setCharacterState] = useState<CharacterAnimationState>("idle");
  const [clientState, setClientState] = useState<ClientUpdate>({
    id: 0,
    position: new Vector3(),
    rotation: new Vector2(),
    state: "idle",
  });

  const speed = useRef(0);
  const azimuthalAngle = useRef<number>(0);

  const tempBox = useRef<Box3>(new Box3());
  const tempMatrix = useRef<Matrix4>(new Matrix4());
  const tempSegment = useRef<Line3>(new Line3());
  const tempVector = useRef<Vector3>(new Vector3());
  const tempVector2 = useRef<Vector3>(new Vector3());

  const characterVelocity = useRef<Vector3>(new Vector3());
  const characterOnGround = useRef<boolean>(false);
  const characterCanJump = useRef<boolean>(true);

  const currentHeight = useRef<number>(0);

  const getCharacterState = () => {
    if (conflictingDirection) return "idle";
    const jumpHeight = characterVelocity.current.y > 0 ? 0.2 : 1.8;
    if (currentHeight.current > jumpHeight && !characterOnGround.current) return "air";
    return run && anyDirection ? "run" : anyDirection ? "walk" : "idle";
  };

  const updateAzimuthalAngle = (): void => {
    if (!characterRef.current) return;
    azimuthalAngle.current = Math.atan2(
      camera.position.x - characterRef.current.position.x,
      camera.position.z - characterRef.current.position.z
    );
  };

  const updateRotation = () => {
    if (conflictingDirection) return;
    let rotationOffset = 0;

    if (forward) {
      rotationOffset = Math.PI;
      if (left) rotationOffset += oneFourthPI;
      if (right) rotationOffset -= oneFourthPI;
    } else if (backward) {
      rotationOffset = tau;
      if (left) rotationOffset = -tau - oneFourthPI;
      if (right) rotationOffset = tau + oneFourthPI;
    } else if (left) {
      rotationOffset = -halfPI;
    } else if (right) {
      rotationOffset = halfPI;
    }

    if (characterRef.current) {
      updateAzimuthalAngle();
      const deltaTheta = azimuthalAngle.current;
      const rotationQuaternion = new Quaternion();
      rotationQuaternion.setFromAxisAngle(vectorUp, deltaTheta + rotationOffset);
      characterRef.current.quaternion.rotateTowards(rotationQuaternion, 0.07);
    }
  };

  const updateSpeed = () => {
    const targetSpeed = run ? maxRunSpeed : anyDirection ? maxWalkSpeed : 0;
    speed.current += ease(targetSpeed, speed.current, 0.05);
  };

  const updatePosition = () => {
    if (!characterRef.current) return;

    const dt = time.smoothDelta > time.delta * 1.75 ? time.delta : time.smoothDelta;

    if (characterOnGround.current) {
      if (!jump) characterCanJump.current = true;
      if (jump && characterCanJump.current) {
        characterVelocity.current.y += jumpForce;
        characterCanJump.current = false;
      } else {
        characterVelocity.current.y = dt * gravity;
      }
    } else {
      characterVelocity.current.y += dt * gravity;
      characterCanJump.current = false;
    }

    characterRef.current.position.addScaledVector(characterVelocity.current, dt);

    tempVector.current.set(0, 0, 0);

    if (forward) {
      const forwardVector = new Vector3(0, 0, -1).applyAxisAngle(vectorUp, azimuthalAngle.current);
      tempVector.current.add(forwardVector);
    }
    if (backward) {
      const backwardVector = new Vector3(0, 0, 1).applyAxisAngle(vectorUp, azimuthalAngle.current);
      tempVector.current.add(backwardVector);
    }
    if (left) {
      const leftVector = new Vector3(-1, 0, 0).applyAxisAngle(vectorUp, azimuthalAngle.current);
      tempVector.current.add(leftVector);
    }
    if (right) {
      const rightVector = new Vector3(1, 0, 0).applyAxisAngle(vectorUp, azimuthalAngle.current);
      tempVector.current.add(rightVector);
    }

    if (tempVector.current.length() > 0) {
      tempVector.current.normalize();
      characterRef.current.position.addScaledVector(tempVector.current, speed.current * dt);
    }
    characterRef.current.updateMatrixWorld();

    tempBox.current.makeEmpty();
    tempSegment.current.copy(capsuleInfo.segment);
    tempSegment.current.start.applyMatrix4(characterRef.current.matrixWorld).applyMatrix4(tempMatrix.current);
    tempSegment.current.end.applyMatrix4(characterRef.current.matrixWorld).applyMatrix4(tempMatrix.current);
    tempBox.current.expandByPoint(tempSegment.current.start);
    tempBox.current.expandByPoint(tempSegment.current.end);
    tempBox.current.min.subScalar(capsuleInfo.radius);
    tempBox.current.max.addScalar(capsuleInfo.radius!);

    collisionsManager.applyColliders(tempSegment.current, capsuleInfo.radius, tempBox.current);

    const newPosition = tempVector.current;
    newPosition.copy(tempSegment.current.start);

    const deltaVector = tempVector2.current;
    deltaVector.subVectors(newPosition, characterRef.current.position);

    const offset = Math.max(0.0, deltaVector.length() - 1e-5);
    deltaVector.normalize().multiplyScalar(offset);

    characterRef.current.position.add(deltaVector);

    characterOnGround.current = deltaVector.y > Math.abs(dt * characterVelocity.current.y * 0.25);

    if (characterOnGround.current) {
      characterVelocity.current.set(0, 0, 0);
    } else {
      deltaVector.normalize();
      characterVelocity.current.addScaledVector(deltaVector, -deltaVector.dot(characterVelocity.current));
    }
  };

  const updateNetworkState = useCallback(() => {
    if (!characterRef.current || id === null) return;
    setClientState({
      id: id,
      position: characterRef.current.position.clone(),
      rotation: new Vector2(characterRef.current.quaternion.y, characterRef.current.quaternion.w),
      state: characterState,
    });
  }, [characterState, id]);

  useEffect(() => {
    if (characterRef.current && id !== null) {
      const interval = setInterval(() => {
        updateNetworkState();
        if (sendUpdate) sendUpdate(clientState);
      }, packetsUpdateRate);

      return () => clearInterval(interval);
    }
  }, [clientState, id, sendUpdate, updateNetworkState]);

  useFrame(() => {
    setCharacterState(getCharacterState());
    updateSpeed();
    updatePosition();
    if (anyDirection) updateRotation();
    if (characterRef.current) {
      if (characterRef.current.position.y < 0) {
        characterRef.current.position.y = 10;
      }
    }
    if (characterRef.current && colliders) {
      rayCaster.current.set(characterRef.current.position, vectorDown);
      const hit = rayCaster.current.intersectObjects([colliders]);
      if (hit.length > 0) currentHeight.current = hit[0].distance;
    }
  });

  return <group ref={characterRef}>{children(characterState)}</group>;
};
