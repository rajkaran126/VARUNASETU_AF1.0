import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface Loaded3DAssets {
  cargoShip?: THREE.Group;
  craneHook?: THREE.Group;
  roboticArm?: THREE.Group;
  submarineDrone?: THREE.Group;
  reefWalls?: THREE.Group;
  seafloorTexture?: THREE.Texture;
  seafloorNormal?: THREE.Texture;
}

const assetCache: Record<string, THREE.Group | THREE.Texture> = {};

export async function loadSubseaAssets(onProgress?: (pct: number) => void): Promise<Loaded3DAssets> {
  const gltfLoader = new GLTFLoader();
  const textureLoader = new THREE.TextureLoader();

  const loadGLTF = (path: string): Promise<THREE.Group> => {
    if (assetCache[path]) {
      return Promise.resolve((assetCache[path] as THREE.Group).clone());
    }
    return new Promise((resolve, reject) => {
      gltfLoader.load(
        path,
        (gltf) => {
          assetCache[path] = gltf.scene;
          resolve(gltf.scene.clone());
        },
        undefined,
        (err) => reject(err)
      );
    });
  };

  const loadTexture = (path: string): Promise<THREE.Texture> => {
    if (assetCache[path]) {
      return Promise.resolve(assetCache[path] as THREE.Texture);
    }
    return new Promise((resolve) => {
      textureLoader.load(
        path,
        (tex) => {
          assetCache[path] = tex;
          resolve(tex);
        },
        undefined,
        () => {
          // Resolve empty texture on error to prevent crashing
          resolve(new THREE.Texture());
        }
      );
    });
  };

  try {
    const [cargoShip, craneHook, roboticArm, submarineDrone, reefWalls, seafloorTexture, seafloorNormal] =
      await Promise.allSettled([
        loadGLTF('/models/cargo-ship.glb'),
        loadGLTF('/models/crane-hook-block.glb'),
        loadGLTF('/models/robotic_manipulator.glb'),
        loadGLTF('/models/one-person-submarine-0b9d14.glb'),
        loadGLTF('/models/model.glb'),
        loadTexture('/models/oceanfloor/basecolor.jpg'),
        loadTexture('/models/oceanfloor/normals.jpg'),
      ]);

    if (onProgress) onProgress(100);

    return {
      cargoShip: cargoShip.status === 'fulfilled' ? cargoShip.value : undefined,
      craneHook: craneHook.status === 'fulfilled' ? craneHook.value : undefined,
      roboticArm: roboticArm.status === 'fulfilled' ? roboticArm.value : undefined,
      submarineDrone: submarineDrone.status === 'fulfilled' ? submarineDrone.value : undefined,
      reefWalls: reefWalls.status === 'fulfilled' ? reefWalls.value : undefined,
      seafloorTexture: seafloorTexture.status === 'fulfilled' ? seafloorTexture.value : undefined,
      seafloorNormal: seafloorNormal.status === 'fulfilled' ? seafloorNormal.value : undefined,
    };
  } catch (error) {
    console.warn('Failed to load some 3D assets, falling back to procedural meshes:', error);
    return {};
  }
}
