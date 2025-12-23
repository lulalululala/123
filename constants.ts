import * as THREE from 'three';

export const TREE_CONFIG = {
  LEAF_COUNT: 9000,
  RIBBON_COUNT: 600,
  NEBULA_COUNT: 60,
  HEIGHT: 26,
  BASE_RADIUS: 10,
};

export const COLORS = {
  GRADIENT_STOPS: [
    new THREE.Color('#012340'),
    new THREE.Color('#034C8C'),
    new THREE.Color('#03588C'),
    new THREE.Color('#99BCEC'),
    new THREE.Color('#F8D6E5'),
  ],
  RIBBON: new THREE.Color('#F8D6E5'),
  BACKGROUND: '#020205',
  STAR: new THREE.Color('#F8D6E5'),
  STAR_EMISSIVE: new THREE.Color('#F8D6E5'),
};
