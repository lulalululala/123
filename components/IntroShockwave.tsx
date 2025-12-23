import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { TREE_CONFIG } from '../constants';

interface IntroShockwaveProps {
  isActive: boolean;
  onFinish: () => void;
  startTime: number;
  introShockwaveRef: React.MutableRefObject<number>;
}

export const IntroShockwave: React.FC<IntroShockwaveProps> = ({
  isActive,
  onFinish,
  startTime,
  introShockwaveRef
}) => {
  const { camera } = useThree();
  
  // Camera start and end positions
  const centerPos = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const startCamPos = useMemo(() => new THREE.Vector3(0, 55, 0.1), []);
  const endCamPos = useMemo(() => new THREE.Vector3(0, 35, 0.1), []); // Mid-way drop
  const finalCamPos = useMemo(() => new THREE.Vector3(0, 0, 54), []); // Final view

  useFrame((state) => {
    if (!isActive) return;

    const elapsed = state.clock.elapsedTime - startTime;
    const DURATION_PHASE_1 = 0.75; // Fast drop
    const TOTAL_DURATION = 1.0; 

    const progress = Math.min(elapsed / 7.5, 1); // Slow down the whole thing relative to seconds

    // We can just use the provided logic which seemed to be:
    // Drop down -> Shockwave triggers -> Camera pulls back
    
    // Normalize time to 0-1 for the sequence
    // Let's make it punchy:
    // 0.0 -> 0.75: Camera drops from top to middle
    // 0.75: IMPACT (Shockwave triggers)
    // 0.75 -> 1.0: Camera moves to final position
    
    const seqProgress = Math.min(elapsed / 2.5, 1); // 2.5 seconds total intro

    const currentPos = new THREE.Vector3();

    if (seqProgress < 0.6) {
       // Phase 1: Drop
       const t = seqProgress / 0.6;
       // Ease in out
       const ease = -(Math.cos(Math.PI * t) - 1) / 2;
       currentPos.lerpVectors(startCamPos, endCamPos, ease);
       introShockwaveRef.current = -1000;
    } else {
       // Phase 2: Impact & Pull back
       const t = (seqProgress - 0.6) / 0.4;
       // Elastic out or simple ease out
       const ease = 1 - Math.pow(1 - t, 3);
       
       // Blend from endCamPos to finalCamPos
       // We want a slight "bounce" or curve
       const midPoint = new THREE.Vector3(0, 25, 30);
       
       // Quadratic bezier curve for smooth camera path
       const invT = 1 - ease;
       currentPos.x = invT * invT * endCamPos.x + 2 * invT * ease * midPoint.x + ease * ease * finalCamPos.x;
       currentPos.y = invT * invT * endCamPos.y + 2 * invT * ease * midPoint.y + ease * ease * finalCamPos.y;
       currentPos.z = invT * invT * endCamPos.z + 2 * invT * ease * midPoint.z + ease * ease * finalCamPos.z;

       // Trigger shockwave
       // Map t (0-1) to height (Top to Bottom)
       const topY = TREE_CONFIG.HEIGHT / 2 + 5;
       const bottomY = -TREE_CONFIG.HEIGHT / 2 - 5;
       introShockwaveRef.current = THREE.MathUtils.lerp(topY, bottomY, t);
    }

    camera.position.copy(currentPos);
    camera.lookAt(centerPos);

    if (seqProgress >= 1) {
      onFinish();
      introShockwaveRef.current = -1000; // Reset
    }
  });

  return null;
};
