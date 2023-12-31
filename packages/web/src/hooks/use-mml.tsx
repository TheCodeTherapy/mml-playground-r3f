/* eslint-disable @typescript-eslint/no-unused-vars */
import { Camera } from "@react-three/fiber";
import {
  IMMLScene,
  Interaction,
  InteractionManager,
  MMLClickTrigger,
  PromptManager,
  InteractionListener,
  PromptProps,
  registerCustomElementsToWindow,
  PositionAndRotation,
  setGlobalMScene,
} from "mml-web";
import { RefObject, useEffect, useRef } from "react";
import { AudioListener, Group, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from "three";

import { CollisionsManager } from "../collisions/collisions-manager";

export class CoreMMLScene {
  private debug: boolean = false;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private mmlScene: Partial<IMMLScene>;
  private promptManager: PromptManager;
  private interactionListener: InteractionListener;
  private audioListener: AudioListener;

  private clickTrigger: MMLClickTrigger;

  private collisionsManager: CollisionsManager;

  constructor(
    group: Group,
    renderer: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera,
    collisionsManager: CollisionsManager,
    getCharacterPositionAndRotation: () => PositionAndRotation
  ) {
    this.scene = scene;
    this.camera = camera;
    this.collisionsManager = collisionsManager;

    const { interactionListener } = InteractionManager.init(document.body, this.camera, this.scene);

    this.promptManager = PromptManager.init(document.body);
    this.interactionListener = interactionListener;
    this.audioListener = new AudioListener();

    document.addEventListener("mousedown", this.onMouseDown.bind(this));

    this.mmlScene = {
      getAudioListener: () => this.audioListener,
      getRenderer: () => renderer,
      getThreeScene: () => scene,
      getRootContainer: () => group,
      getCamera: () => camera,
      getUserPositionAndRotation: getCharacterPositionAndRotation,
      addCollider: (object: Object3D) => {
        this.collisionsManager.addMeshesGroup(object as Group);
      },
      updateCollider: (object: Object3D) => {
        this.collisionsManager.updateMeshesGroup(object as Group);
      },
      removeCollider: (object: Object3D) => {
        this.collisionsManager.removeMeshesGroup(object as Group);
      },
      addInteraction: (interaction: Interaction) => {
        this.interactionListener.addInteraction(interaction);
      },
      updateInteraction: (interaction: Interaction) => {
        this.interactionListener.updateInteraction(interaction);
      },
      removeInteraction: (interaction: Interaction) => {
        this.interactionListener.removeInteraction(interaction);
      },
      prompt: (promptProps: PromptProps, callback: (message: string | null) => void) => {
        this.promptManager.prompt(promptProps, callback);
      },
    };
    setGlobalMScene(this.mmlScene as IMMLScene);
    registerCustomElementsToWindow(window);

    this.clickTrigger = MMLClickTrigger.init(document, this.mmlScene as IMMLScene);
    if (this.debug) console.log(this.clickTrigger);
  }

  onMouseDown() {
    if (this.audioListener.context.state === "suspended") {
      this.audioListener.context.resume();
    }
  }

  traverseDOM(node: Node | null, callback: (node: Node) => void): void {
    if (node === null) return;
    const notGarbage = node.nodeType !== 3 && node.nodeType !== 8;
    const isMML = node.nodeName.toLowerCase().includes("m-");
    if (notGarbage) {
      if (isMML) callback(node);
      let childNode = node.firstChild;
      while (childNode) {
        this.traverseDOM(childNode, callback);
        childNode = childNode.nextSibling;
      }
    }
  }
}

export function useMML(
  mainGroupRef: RefObject<Group>,
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera | PerspectiveCamera,
  collisionsManager: CollisionsManager,
  getCharacterPositionAndRotation: () => PositionAndRotation
) {
  const ranOnce = useRef<boolean>(false);
  useEffect(() => {
    if (ranOnce.current === false && mainGroupRef.current) {
      ranOnce.current = true;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      document.getElementById("playground")?.setAttribute("src", `${protocol}//${host}/document`);
      new CoreMMLScene(
        mainGroupRef.current,
        renderer,
        scene,
        camera as PerspectiveCamera,
        collisionsManager,
        getCharacterPositionAndRotation
      );
    }
  });
}
