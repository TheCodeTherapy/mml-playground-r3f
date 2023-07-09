import { useCallback, useEffect, useState } from "react";
import { Box3, Line3, Object3D, Vector3 } from "three";

import { BoxHandler, useBox } from "./use-box";

export type Capsule = {
  radius: number;
  height: number;
  line: THREE.Line3;
};

export type CapsuleConfig = { radius?: number; height?: number; center?: Vector3 } | "auto";

export class BoundingVolume extends Object3D {
  public isBoundingVolume: boolean;
  public boundingCapsule: Capsule;
  public boundingBox: THREE.Box3;

  constructor() {
    super();
    this.isBoundingVolume = true;
    this.boundingCapsule = { radius: 0, height: 0, line: new Line3() };
    this.boundingBox = new Box3();
  }

  computeBoundingVolume() {
    const { line, height } = this.boundingCapsule;
    const box = this.boundingBox;
    const offset = height / 2;

    line.end.set(0, -offset, 0);
    line.start.set(0, offset, 0);

    line.start.applyMatrix4(this.matrixWorld);
    line.end.applyMatrix4(this.matrixWorld);
    box.makeEmpty();
    box.setFromPoints([line.start, line.end]);
    box.min.addScalar(-this.boundingCapsule.radius);
    box.max.addScalar(this.boundingCapsule.radius);
  }
}

export function useBoundingVolume(config: CapsuleConfig, ref: React.MutableRefObject<THREE.Object3D>) {
  const [bounding] = useState<BoundingVolume>(() => new BoundingVolume());

  const handleBox = useCallback<BoxHandler>(
    (size) => {
      if (config === "auto") {
        const capsule = bounding.boundingCapsule;
        capsule.radius = size.x / 2;
        const height = size.y - capsule.radius * 2;
        capsule.height = height > 0 ? height : 0;
      }
    },
    [bounding.boundingCapsule, config]
  );

  useBox(ref, handleBox, { precise: true });

  useEffect(() => {
    const capsule = bounding.boundingCapsule;

    if (config !== "auto") {
      capsule.radius = config.radius || 0;
      capsule.height = config.height || 0;
    }

    const offset = capsule.height / 2;
    capsule.line.end.copy(new Vector3(0, -offset, 0));
    capsule.line.start.copy(new Vector3(0, offset, 0));
    ref.current.matrix.decompose(bounding.position, bounding.quaternion, bounding.scale);
  }, [bounding, config, ref]);

  return bounding;
}
