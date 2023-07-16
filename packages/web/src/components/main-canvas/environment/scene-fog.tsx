import { useThree } from "@react-three/fiber";
import { Fog } from "three";

export const SceneFog = () => {
  const { scene } = useThree();
  scene.fog = new Fog(0xc7cad0, 30, 210);
  return null;
};
