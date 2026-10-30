import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export interface Loaded3DAssets {
  cargoShip?: THREE.Group;
  craneHook?: THREE.Group;
  roboticArm?: THREE.Group;
  submarineDrone?: THREE.Group;
  reefWalls?: THREE.Group;
  oceanFloorMesh?: THREE.Group;
  seafloorTexture?: THREE.Texture;
  seafloorNormal?: THREE.Texture;
  seafloorRoughness?: THREE.Texture;
}

const assetCache: Record<string, any> = {};

export async function loadSubseaAssets(onProgress?: (pct: number) => void): Promise<Loaded3DAssets> {
  const gltfLoader = new GLTFLoader();
  const objLoader = new OBJLoader();
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
        (err) => {
          console.warn(`Could not load GLTF at ${path}:`, err);
          reject(err);
        }
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
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          assetCache[path] = tex;
          resolve(tex);
        },
        undefined,
        () => {
          resolve(new THREE.Texture());
        }
      );
    });
  };

  const loadOceanFloorOBJ = async (): Promise<THREE.Group | undefined> => {
    const path = '/models/oceanfloor/Oceanfloor Fixed Final.obj';
    if (assetCache[path]) {
      return (assetCache[path] as THREE.Group).clone();
    }
    return new Promise((resolve) => {
      objLoader.load(
        path,
        (obj) => {
          assetCache[path] = obj;
          resolve(obj.clone());
        },
        undefined,
        (err) => {
          console.warn('OBJLoader error on oceanfloor, using fallback terrain:', err);
          resolve(undefined);
        }
      );
    });
  };

  try {
    const [
      cargoShipRes,
      craneHookRes,
      roboticArmRes,
      submarineDroneRes,
      reefWallsRes,
      oceanFloorRes,
      seafloorTexRes,
      seafloorNormRes,
      seafloorRoughRes,
    ] = await Promise.allSettled([
      loadGLTF('/models/cargo-ship.glb'),
      loadGLTF('/models/crane-hook-block.glb'),
      loadGLTF('/models/robotic_manipulator.glb'),
      loadGLTF('/models/one-person-submarine-0b9d14.glb'),
      loadGLTF('/models/model.glb'),
      loadOceanFloorOBJ(),
      loadTexture('/models/oceanfloor/basecolor.jpg'),
      loadTexture('/models/oceanfloor/normals.jpg'),
      loadTexture('/models/oceanfloor/roughness.jpg'),
    ]);

    if (onProgress) onProgress(100);

    return {
      cargoShip: cargoShipRes.status === 'fulfilled' ? cargoShipRes.value : undefined,
      craneHook: craneHookRes.status === 'fulfilled' ? craneHookRes.value : undefined,
      roboticArm: roboticArmRes.status === 'fulfilled' ? roboticArmRes.value : undefined,
      submarineDrone: submarineDroneRes.status === 'fulfilled' ? submarineDroneRes.value : undefined,
      reefWalls: reefWallsRes.status === 'fulfilled' ? reefWallsRes.value : undefined,
      oceanFloorMesh: oceanFloorRes.status === 'fulfilled' ? oceanFloorRes.value : undefined,
      seafloorTexture: seafloorTexRes.status === 'fulfilled' ? seafloorTexRes.value : undefined,
      seafloorNormal: seafloorNormRes.status === 'fulfilled' ? seafloorNormRes.value : undefined,
      seafloorRoughness: seafloorRoughRes.status === 'fulfilled' ? seafloorRoughRes.value : undefined,
    };
  } catch (error) {
    console.warn('Failed to load some 3D assets:', error);
    return {};
  }
}
