import { configure, makeAutoObservable, runInAction } from "mobx";
import {
  AnimationAction,
  AnimationMixer,
  Box3,
  Box3Helper,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
} from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

import { CharacterMaterial } from "./character-material";

export type CharacterAnimationState = "idle" | "walk" | "run" | "jumpToAir" | "air" | "airToGround";

type TModelLoad = { totalBytes: number; bytesLoaded: number; percentLoaded: number };

export interface CharacterAnimatorProps {
  characterState: CharacterAnimationState;
  transitionDuration?: number;
  isLocal?: boolean;
  id?: number;
}

configure({ enforceActions: "always" });

class CharacterStore {
  private _fbxLoader = new FBXLoader();

  private _container: Object3D = new Object3D();

  private _model: Object3D | null = null;
  private _modelLoad: TModelLoad = {
    totalBytes: 0,
    bytesLoaded: 0,
    percentLoaded: 0,
  };
  private _modelLoaded: boolean = false;
  private _modelHead: Mesh<SphereGeometry, MeshBasicMaterial> | null = null;
  private _modelMaterial: CharacterMaterial = new CharacterMaterial();

  private _modelBoundingBox: Box3 | null = null;
  private _modelBoundingBoxHelper: Box3Helper | null = null;

  private _mixer: AnimationMixer | null = null;
  private _animationStates: CharacterAnimationState[] = ["idle", "walk", "run", "jumpToAir", "air", "airToGround"];
  private _currentAnimationState: CharacterAnimationState = "idle";
  private _animationActions: Record<CharacterAnimationState, AnimationAction | null> = {
    idle: null,
    walk: null,
    run: null,
    jumpToAir: null,
    air: null,
    airToGround: null,
  };
  private _currentAnimationAction: AnimationAction | null = null;

  constructor() {
    makeAutoObservable(this);
    this._loadModel().then(() => {
      this._loadAnimations();
    });
  }

  get currentAnimationState(): CharacterAnimationState {
    return this._currentAnimationState;
  }

  public setCurrentAnimationState(state: CharacterAnimationState) {
    runInAction(() => (this._currentAnimationState = state));
  }

  private async _loadModel(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._fbxLoader.load(
        "/assets/models/bot_100_tpose3.fbx",
        (fbx) => {
          fbx.traverse((child) => {
            if (child.type === "SkinnedMesh") {
              (child as Mesh).material = this._modelMaterial;
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          runInAction(() => {
            fbx.updateMatrixWorld();
            fbx.updateMatrix();
            fbx.scale.set(0.01, 0.01, 0.01);
            this._model = fbx;
            this._modelBoundingBox = new Box3().setFromObject(this._model);
            this._modelBoundingBoxHelper = new Box3Helper(this._modelBoundingBox);
            this._modelHead = new Mesh(new SphereGeometry(0.1, 4, 4), new MeshBasicMaterial({ color: 0x0000ff }));
            this._modelHead.visible = false;
            const center = this._modelBoundingBox.getCenter(new Vector3());
            const boxHeight = this._modelBoundingBox.max.y - this._modelBoundingBox.min.y;
            const y = this._modelBoundingBox.min.y + 0.7 * boxHeight;
            this._modelHead.position.set(center.x, y, center.z + 0.05);
            this._model.position.set(0, -0.5, 0);
            this._container.add(this._model);
            this._container.add(this._modelHead);
            this._mixer = new AnimationMixer(this._model);
            this._model = this._container;
            resolve();
          });
        },
        (e: ProgressEvent) => {
          if (e.lengthComputable === true) {
            runInAction(() => {
              this._modelLoad.totalBytes = e.total;
              this._modelLoad.bytesLoaded = e.loaded;
              this._modelLoad.percentLoaded = (e.loaded / e.total) * 100;
            });
          }
        },
        (errorEvent) => reject(`unable to load model: ${errorEvent}`)
      );
    });
  }

  private _loadAnimations() {
    const loadAnimations = (state: CharacterAnimationState): Promise<[string, AnimationAction]> => {
      return new Promise<[string, AnimationAction]>((resolve, reject) => {
        this._fbxLoader.load(
          `/assets/models/bot_100_${state}.fbx`,
          (fbx) => {
            fbx.scale.set(0.01, 0.01, 0.01);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const action = this._mixer!.clipAction(fbx.animations[0]) as any;
            action.name = `${state}`;
            resolve([state, action as AnimationAction]);
          },
          undefined,
          (errorEvent) => reject(`unable to load animation: ${errorEvent}`)
        );
      });
    };
    Promise.all(this._animationStates.map(loadAnimations)).then((loadedActions) => {
      const newActions = loadedActions.reduce((acc, [state, action]) => ({ ...acc, [state]: action }), {
        ...this._animationActions,
      });
      runInAction(() => {
        this._animationActions = newActions;
        this._currentAnimationAction = newActions.idle;
        this._modelLoaded = true;
      });
    });
  }

  get modelLoad(): TModelLoad {
    return this._modelLoad;
  }

  get modelPercentLoaded(): number {
    return this._modelLoad.percentLoaded;
  }

  get modelLoaded(): boolean {
    return this._modelLoaded;
  }

  get model() {
    return this._model;
  }

  get modelBoundingBoxHelper() {
    return this._modelBoundingBoxHelper;
  }

  get mixer() {
    return this._mixer;
  }

  get currentAnimationAction(): AnimationAction | null {
    return this._currentAnimationAction;
  }

  public setCurrentAnimationAction(action: AnimationAction) {
    runInAction(() => (this._currentAnimationAction = action));
  }

  public getAnimationAction(state: CharacterAnimationState): AnimationAction | null | undefined {
    return this._animationActions[state]!;
  }

  get modelHeadPosition() {
    if (this._modelHead) return this._modelHead.getWorldPosition(new Vector3());
    return new Vector3();
  }

  get modelHead() {
    return this._modelHead;
  }

  public updateMaterialUniforms(time: number, id?: number) {
    runInAction(() => {
      if (this._modelMaterial.uniforms.time) {
        this._modelMaterial.uniforms.time.value = time;
        if (id) {
          this._modelMaterial.uniforms.diffuseRandomColor.value = this._modelMaterial.colorsCube216[id];
        }
        this._modelMaterial.needsUpdate = true;
      }
    });
  }
}

const CHAR_STORE = new CharacterStore();

export { CHAR_STORE, CharacterStore };
