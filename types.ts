import * as THREE from 'three';

export enum ParticleType {
  LEAF_TINY = 'LEAF_TINY',
  LEAF_STAR = 'LEAF_STAR',
  RIBBON = 'RIBBON',
  NEBULA = 'NEBULA',
  ORNAMENT = 'ORNAMENT'
}

export interface ParticleData {
  id: number;
  type: ParticleType;
  treePosition: THREE.Vector3;
  randomPosition: THREE.Vector3;
  color: THREE.Color;
  scale: number;
  rotation: THREE.Euler;
  speed: number;
}

export interface TreeData {
  leavesFine: ParticleData[];
  leavesCrystals: ParticleData[];
  ribbon: ParticleData[];
  nebula: ParticleData[];
}
