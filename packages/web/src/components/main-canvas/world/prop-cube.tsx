export const PropCube = () => {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 1, 0]} renderOrder={1}>
        <boxGeometry args={[2, 2, 2]} />
        <meshPhysicalMaterial
          color={"#aaaaaa"}
          transmission={0.7}
          metalness={0.5}
          roughness={0.3}
          ior={1.2}
          thickness={1.0}
        />
      </mesh>
    </group>
  );
};
