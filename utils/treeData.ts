import * as THREE from 'three';
import { ParticleData, ParticleType, TreeData } from '../types';
import { TREE_CONFIG, COLORS } from '../constants';

const getRandomPosition = (): THREE.Vector3 => {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);
  const r = 35 + Math.random() * 55;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta) * 0.2, // Flattened slightly
    r * Math.cos(phi)
  );
};

const getGradientColor = (t: number): THREE.Color => {
  const stops = COLORS.GRADIENT_STOPS;
  const step = 1 / (stops.length - 1);
  const index = Math.min(Math.floor(t / step), stops.length - 2);
  const alpha = (t - index * step) / step;
  return new THREE.Color().lerpColors(stops[index], stops[index + 1], alpha);
};

export const generateTreeData = (): TreeData => {
  const leavesFine: ParticleData[] = [];
  const leavesCrystals: ParticleData[] = [];
  const ribbon: ParticleData[] = [];
  const nebula: ParticleData[] = [];

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  // Generate Leaves
  for (let i = 0; i < TREE_CONFIG.LEAF_COUNT; i++) {
    const t = i / TREE_CONFIG.LEAF_COUNT;
    const y = TREE_CONFIG.HEIGHT * t;
    const radius = TREE_CONFIG.BASE_RADIUS * (1 - t);
    
    // Add some organic noise to radius
    const noise = 0.8 + 0.2 * Math.random();
    const r = radius * noise;
    
    const theta = i * goldenAngle;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);

    const pos = new THREE.Vector3(x, y - TREE_CONFIG.HEIGHT / 2, z);
    
    const color = getGradientColor(t).clone();
    color.offsetHSL(0, 0.25, 0); // Boost lightness slightly
    // Make lower leaves darker
    const brightness = 0.8 + t * 2.5; 
    color.multiplyScalar(brightness);

    const data: ParticleData = {
      id: i,
      treePosition: pos,
      randomPosition: getRandomPosition(),
      color: color,
      rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      speed: 0.5 + Math.random() * 2,
      type: Math.random() < 0.85 ? ParticleType.LEAF_TINY : ParticleType.LEAF_STAR,
      scale: Math.random() < 0.85 ? 0.03 + Math.random() * 0.03 : 0.08 + Math.random() * 0.06
    };

    if (data.type === ParticleType.LEAF_TINY) {
      leavesFine.push(data);
    } else {
      leavesCrystals.push(data);
    }
  }

  // Generate Ribbon
  for (let i = 0; i < TREE_CONFIG.RIBBON_COUNT; i++) {
    // Ribbon logic is handled dynamically in shader/update, but we need placeholder data
    const color = getGradientColor(i / TREE_CONFIG.RIBBON_COUNT).clone();
    color.lerp(new THREE.Color('#ffffff'), 0.5);
    color.multiplyScalar(2); // Emissive boost

    ribbon.push({
      id: i,
      type: ParticleType.RIBBON,
      treePosition: new THREE.Vector3(0, 0, 0), // Calculated in frame loop
      randomPosition: getRandomPosition(),
      color: color,
      scale: 0.06 + Math.random() * 0.04,
      rotation: new THREE.Euler(0, 0, 0),
      speed: 1
    });
  }

  // Generate Nebula (floaty bits around)
  for (let i = 0; i < TREE_CONFIG.NEBULA_COUNT; i++) {
    const t = Math.random();
    const rBase = TREE_CONFIG.BASE_RADIUS * (1 - t) + 4; // Wider than tree
    const r = 2 + Math.random() * rBase;
    const theta = Math.random() * Math.PI * 2;
    
    const x = r * Math.cos(theta);
    const y = t * TREE_CONFIG.HEIGHT - TREE_CONFIG.HEIGHT / 2;
    const z = r * Math.sin(theta);

    const color = getGradientColor(t).clone();
    color.offsetHSL(0, 0.2, 0.1);
    color.multiplyScalar(3);

    nebula.push({
      id: i + 30000,
      type: ParticleType.NEBULA,
      treePosition: new THREE.Vector3(x, y, z),
      randomPosition: getRandomPosition(),
      color: color,
      scale: 0.15 + Math.random() * 0.25,
      rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      speed: 1
    });
  }

  return { leavesFine, leavesCrystals, ribbon, nebula };
};
