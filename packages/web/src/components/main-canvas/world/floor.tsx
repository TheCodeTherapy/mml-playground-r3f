import { useEffect, useState } from "react";
import { FrontSide, NearestFilter, RepeatWrapping, Texture, TextureLoader } from "three";

export function Floor() {
  const floorSize: number = 80;
  const floorTextureUrl = "/assets/textures/checker.png";
  const [floorTexture, setFloorTexture] = useState<Texture | null>(null);

  useEffect(() => {
    if (floorTexture) {
      floorTexture.minFilter = floorTexture.magFilter = NearestFilter;
      floorTexture.wrapS = floorTexture.wrapT = RepeatWrapping;
      floorTexture.repeat.set(floorSize / 2, floorSize / 2);
    } else {
      new TextureLoader().load(floorTextureUrl, (texture) => setFloorTexture(texture));
    }
  }, [floorTexture]);

  return (
    <group>
      <mesh receiveShadow position={[0, 0, 0]} rotation={[Math.PI * -0.5, 0, 0]}>
        <circleGeometry args={[floorSize, floorSize]} />
        <ambientLight intensity={0.05} />
        <meshStandardMaterial color={0xcccccc} map={floorTexture} side={FrontSide} metalness={0.95} roughness={0.45} />
      </mesh>
    </group>
  );
}
