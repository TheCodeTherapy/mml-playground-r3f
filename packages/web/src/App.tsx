import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import { ToastContainer } from "react-toastify";
// eslint-disable-next-line import/no-unresolved
import "react-toastify/ReactToastify.min.css";

import { MainCanvas } from "./components/main-canvas/main-canvas";
import { NetworkProvider } from "./network/network-provider";

function App() {
  const groupRef = useRef(null);
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  return (
    <>
      <ToastContainer />
      <NetworkProvider>
        <div id="canvas_wrapper" className="canvas-wrapper">
          <Canvas shadows camera={{ fov: 80, position: [0, 3, 10] }}>
            <group ref={groupRef}>
              <MainCanvas mainGroupRef={groupRef} />
            </group>
          </Canvas>
        </div>
      </NetworkProvider>
    </>
  );
}

export default App;
