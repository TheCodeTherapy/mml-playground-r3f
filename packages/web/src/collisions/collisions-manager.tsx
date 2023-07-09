import { BufferGeometry, Color, FrontSide, Group, Mesh, MeshStandardMaterial, Object3D, Scene, Vector3 } from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MeshBVH, MeshBVHVisualizer } from "three-mesh-bvh";

type CollisionMeshState = {
  source: Group;
  meshBVH: MeshBVH;
  visualizer: MeshBVHVisualizer | null;
};

export class CollisionsManager {
  private debug: boolean = false;
  private scene: Scene;
  private tempVector: Vector3 = new Vector3();
  private tempVector2: Vector3 = new Vector3();

  private collisionMeshState: Map<Group, CollisionMeshState> = new Map();

  public mergedMesh: Mesh | null = null;

  public colliders: Group = new Group();
  public collisionEnabledMeshes: Record<string, Mesh> = {};

  constructor(scene: Scene) {
    this.scene = scene;
  }

  private safeAddColliders(child: Mesh): void {
    if (!(child.uuid in this.collisionEnabledMeshes)) {
      const clone = child.clone();
      this.collisionEnabledMeshes[child.uuid] = clone;
      this.colliders.add(clone);
    }
  }

  private removeFromColliders(child: Mesh): void {
    if (child.uuid in this.collisionEnabledMeshes) {
      this.colliders.remove(this.collisionEnabledMeshes[child.uuid]);
      delete this.collisionEnabledMeshes[child.uuid];
    }
  }

  private createCollisionMeshState(group: Group): CollisionMeshState {
    const geometries: Array<BufferGeometry> = [];
    group.traverse((child: Object3D) => {
      if (child.type === "Mesh") {
        const mesh = child as Mesh;
        mesh.localToWorld(new Vector3());
        mesh.updateMatrixWorld();
        this.safeAddColliders(mesh);
        const geometry = mesh.geometry.clone();
        geometry.applyMatrix4(mesh.matrixWorld);
        geometries.push(geometry);
      }
    });
    const newBufferGeometry = BufferGeometryUtils.mergeGeometries(geometries);
    const meshBVH = new MeshBVH(newBufferGeometry);

    if (!this.mergedMesh) {
      this.mergedMesh = new Mesh(
        newBufferGeometry.clone(),
        new MeshStandardMaterial({ color: 0xff0000, side: FrontSide, wireframe: false })
      );
    } else {
      this.mergedMesh.geometry.dispose();
      this.mergedMesh.geometry = newBufferGeometry;
    }

    if (!this.debug) return { source: group, visualizer: null, meshBVH };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.mergedMesh.geometry as any).boundsTree = meshBVH;
    const visualizer = new MeshBVHVisualizer(this.mergedMesh, 3);
    visualizer.edgeMaterial.color = new Color(0x0000ff);
    visualizer.update();
    return { source: group, visualizer, meshBVH };
  }

  public addMeshesGroup(group: Group): void {
    const meshState = this.createCollisionMeshState(group);
    if (meshState.visualizer) {
      this.scene.add(meshState.visualizer);
    }
    this.collisionMeshState.set(group, meshState);
  }

  public updateMeshesGroup(group: Group): void {
    const meshState = this.collisionMeshState.get(group);
    if (meshState) {
      const newMeshState = this.createCollisionMeshState(group);
      if (meshState.visualizer) {
        this.scene.remove(meshState.visualizer);
      }
      if (newMeshState.visualizer) {
        this.scene.add(newMeshState.visualizer);
      }
      this.collisionMeshState.set(group, newMeshState);
    }
  }

  public removeMeshesGroup(group: Group): void {
    const meshState = this.collisionMeshState.get(group);
    if (meshState) {
      if (meshState.visualizer) {
        this.scene.remove(meshState.visualizer);
      }
      this.collisionMeshState.delete(group);
      if (group) {
        group.traverse((child) => {
          if (child.type === "Mesh") {
            this.removeFromColliders(child as Mesh);
          }
        });
      }
    }
  }

  private applyCollider(
    tempSegment: THREE.Line3,
    radius: number,
    boundingBox: THREE.Box3,
    meshState: CollisionMeshState
  ): boolean {
    let didCollide = false;
    meshState.meshBVH.shapecast({
      intersectsBounds: (box) => box.intersectsBox(boundingBox),
      intersectsTriangle: (tri) => {
        const triPoint = this.tempVector;
        const capsulePoint = this.tempVector2;
        const distance = tri.closestPointToSegment(tempSegment, triPoint, capsulePoint);
        if (distance < radius) {
          const depth = radius - distance;
          const direction = capsulePoint.sub(triPoint).normalize();
          tempSegment.start.addScaledVector(direction, depth);
          tempSegment.end.addScaledVector(direction, depth);
          didCollide = true;
        }
      },
    });
    return didCollide;
  }

  public applyColliders(tempSegment: THREE.Line3, radius: number, boundingBox: THREE.Box3): void {
    for (const meshState of this.collisionMeshState.values()) {
      this.applyCollider(tempSegment, radius, boundingBox, meshState);
    }
  }
}
