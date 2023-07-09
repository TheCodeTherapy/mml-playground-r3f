import { useEffect, useState } from "react";
import { Box3, Vector3 } from "three";

export type BoxHandler = (size: Vector3, box: Box3) => void;
export type BoxOptions = { precise?: boolean };

export function useBox(ref: React.MutableRefObject<THREE.Object3D>, callback: BoxHandler, options?: BoxOptions) {
  const [size] = useState(() => new Vector3(0, 0, 0));
  const [box] = useState(() => new Box3(new Vector3(0, 0, 0), new Vector3(0, 0, 0)));

  useEffect(() => {
    if (!ref.current) return;
    box.setFromObject(ref.current, options?.precise);
    box.getSize(size);
    callback(size, box);
  }, [box, callback, options?.precise, ref, size]);
}
