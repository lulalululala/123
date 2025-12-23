import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ParticleData, ParticleType } from '../types';
import { TREE_CONFIG, COLORS } from '../constants';

interface TreeParticlesProps {
  data: ParticleData[];
  type: ParticleType;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  isExploded: boolean;
  shockwaveY: number;
  introShockwaveRef: React.MutableRefObject<number>;
}

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

export const TreeParticles: React.FC<TreeParticlesProps> = ({
  data,
  type,
  geometry,
  material,
  isExploded,
  shockwaveY,
  introShockwaveRef
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Initial layout
  useEffect(() => {
    if (meshRef.current) {
      data.forEach((particle, i) => {
        tempObject.position.copy(particle.treePosition);
        tempObject.rotation.copy(particle.rotation);
        tempObject.scale.setScalar(particle.scale);
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
        meshRef.current!.setColorAt(i, particle.color);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [data]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    const introY = introShockwaveRef.current;

    data.forEach((particle, i) => {
      let ribbonScaleX = 1;
      let ribbonScaleZ = 1;
      let nebulaPulse = 1;

      // Special handling for RIBBON type which animates along a path
      if (type === ParticleType.RIBBON && !isExploded) {
        const total = data.length;
        const progress = (i / total + time * 0.025) % 1;
        
        // Spiral path
        const y = TREE_CONFIG.HEIGHT * progress - TREE_CONFIG.HEIGHT / 2 + Math.sin(time * 0.5 + i * 0.1) * 0.15;
        const radiusBase = TREE_CONFIG.BASE_RADIUS * (1 - progress);
        const radiusNoise = Math.sin(progress * Math.PI * 4 + time * 0.2) * 0.2;
        const radius = radiusBase + radiusNoise + 1.8;
        const theta = progress * Math.PI * 8;
        
        const x = radius * Math.cos(theta);
        const z = radius * Math.sin(theta);
        
        tempObject.position.set(x, y, z);
        
        // Look ahead for rotation
        const nextProgress = progress + 0.005;
        const nextY = TREE_CONFIG.HEIGHT * nextProgress - TREE_CONFIG.HEIGHT / 2 + Math.sin(time * 0.5 + i * 0.1) * 0.15;
        const nextRadius = TREE_CONFIG.BASE_RADIUS * (1 - nextProgress) + 1.8;
        const nextTheta = nextProgress * Math.PI * 8;
        tempObject.lookAt(nextRadius * Math.cos(nextTheta), nextY, nextRadius * Math.sin(nextTheta));

        // Pulsing effect
        const pulse = Math.pow(Math.sin(progress * Math.PI), 2.5);
        const waviness = Math.sin(progress * 12 - time * 1.5);
        const glitter = Math.sin(progress * 80 - time * 5);
        const scaleBoost = Math.max(0, waviness) * (glitter * 0.5 + 0.5);
        
        ribbonScaleX = 0.6 + scaleBoost * 12 * pulse;
        ribbonScaleZ = 1 + scaleBoost * 0.5 * pulse;
        
        tempObject.scale.set(
            particle.scale * 10 * ribbonScaleZ, 
            particle.scale * ribbonScaleX, 
            particle.scale * 2.5 * ribbonScaleZ
        );

        if (scaleBoost > 0.5) {
             nebulaPulse = 1.5 + Math.sin(time * 30 + i) * 0.5;
        }

      } else {
        // Standard particle behavior
        meshRef.current!.getMatrixAt(i, tempObject.matrix);
        
        const targetPos = (isExploded ? particle.randomPosition : particle.treePosition).clone();

        // Nebula ambient motion
        if (type === ParticleType.NEBULA && !isExploded) {
          targetPos.y += Math.sin(time * 0.5 + i * 0.2) * 1.2;
          targetPos.x += Math.cos(time * 0.3 + i * 0.3) * 0.6;
          targetPos.z += Math.sin(time * 0.4 + i * 0.1) * 0.6;
        }

        tempObject.position.setFromMatrixPosition(tempObject.matrix);
        tempObject.position.lerp(targetPos, delta * 2.5);
        
        tempObject.rotation.setFromRotationMatrix(tempObject.matrix);
        if (type === ParticleType.NEBULA) {
            tempObject.rotation.x += delta * 0.05;
            tempObject.rotation.y += delta * 0.05;
        } else {
            tempObject.rotation.z += delta * 0.1;
        }
        
        tempObject.scale.setScalar(particle.scale);
      }

      // Shockwave Logic (Intro & Re-crystallize)
      let shockIntensity = 0;
      if (!isExploded) {
        const y = tempObject.position.y;
        
        // Manual shockwave from "Dissolve/Recrystallize" toggle
        if (shockwaveY > -900) {
           // Calculate distance from shockwave plane
           // Add a spiral offset to make it look cooler
           const angle = Math.atan2(tempObject.position.x, tempObject.position.z);
           const dist = y + angle * 2 - shockwaveY;
           const wave = Math.exp(-(dist * dist) * 0.3);
           shockIntensity = Math.max(shockIntensity, wave);
        }

        // Intro shockwave
        if (introY > -900) {
            const angle = Math.atan2(tempObject.position.x, tempObject.position.z);
            const dist = y + angle * 0.5 - introY;
            const wave = Math.exp(-(dist * dist) * 0.1);
            shockIntensity = Math.max(shockIntensity, wave * 1.2);
        }
      }

      // Apply shockwave effect scale
      if (type !== ParticleType.RIBBON) {
        if (shockIntensity > 0.01) {
            tempObject.scale.multiplyScalar(1 + shockIntensity * 1.0);
        }
      }

      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);

      // Color updates based on shockwave
      tempColor.copy(particle.color);
      
      if (shockIntensity > 0.05) {
        const flashColor = new THREE.Color('#FFFAF0');
        tempColor.lerp(flashColor, Math.min(0.6, shockIntensity));
        tempColor.multiplyScalar(1 + shockIntensity * 2.5);
      } else if (type === ParticleType.RIBBON) {
        // Rainbow shimmer for ribbon
        const hueShift = Math.min(1, (ribbonScaleX - 0.2) / 8);
        tempColor.setHSL(0.85 + hueShift * 0.15, 0.9, 0.6 + hueShift * 0.4);
        tempColor.multiplyScalar(1.5 * nebulaPulse);
      } else if (type === ParticleType.NEBULA) {
         // Pulsing nebula
         const pulseFreq = 0.5 + (i * 1337 % 200) / 100;
         const pulsePhase = (i * 991) % (Math.PI * 2);
         const intensity = (Math.sin(time * pulseFreq + pulsePhase) + 1) / 2;
         const boost = 0.1 + Math.pow(intensity, 3) * 4;
         tempColor.multiplyScalar(boost);
      }

      meshRef.current!.setColorAt(i, tempColor);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, data.length]}
      castShadow
      receiveShadow
    />
  );
};
