"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { View, useTexture } from "@react-three/drei";
import { useScrollVelocity } from "./useScrollVelocity";
import { GRADE_INK, stoneFragment, stoneVertex } from "./materials/stone";

/** Lazily loaded WebGL half of GLImage: a View tracking the shell's box. */
export default function GLImageView(props: PlaneProps) {
  return (
    <View className="absolute inset-0" data-gl-view="">
      <Suspense fallback={null}>
        <StonePlane {...props} />
      </Suspense>
    </View>
  );
}

type PlaneProps = {
  src: string;
  imageWidth: number;
  imageHeight: number;
  grade: number;
  parallax: number;
  reveal: React.RefObject<{ value: number }>;
  track: React.RefObject<HTMLDivElement | null>;
  onReady: () => void;
};

function StonePlane({
  src,
  imageWidth,
  imageHeight,
  grade,
  parallax,
  reveal,
  track,
  onReady,
}: PlaneProps) {
  const invalidate = useThree((s) => s.invalidate);
  const tex = useTexture(src, (t) => {
    // raw pass-through: the shader works on the photo's stored values
    t.colorSpace = THREE.NoColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    invalidate();
  });
  const velocity = useScrollVelocity();
  const readyOnce = useRef(false);
  const mesh = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>>(null);

  // The material is created imperatively: R3F copies a `uniforms` prop, so mutating our own
  // object would never reach the GPU. Props are written into material.uniforms every frame.
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: stoneVertex,
        fragmentShader: stoneFragment,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTex: { value: tex },
          uRes: { value: new THREE.Vector2(1, 1) },
          uImageRes: { value: new THREE.Vector2(1, 1) },
          uGrade: { value: new THREE.Color(...GRADE_INK) },
          uGradeAmt: { value: 0 },
          uVelocity: { value: 0 },
          uReveal: { value: 0 },
          uTime: { value: 0 },
          uParallax: { value: 0 },
          uOffset: { value: 0 },
        },
      }),
    [tex],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const el = track.current;
    const uniforms = mesh.current?.material.uniforms;
    if (!el || !uniforms) return;
    const r = el.getBoundingClientRect();
    uniforms.uRes.value.set(r.width, r.height);
    uniforms.uImageRes.value.set(imageWidth, imageHeight);
    uniforms.uGradeAmt.value = grade;
    uniforms.uParallax.value = parallax;
    uniforms.uOffset.value =
      (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
    uniforms.uVelocity.value = velocity.current;
    uniforms.uReveal.value = reveal.current?.value ?? 1;
    uniforms.uTime.value = state.clock.elapsedTime;
    if (!readyOnce.current) {
      readyOnce.current = true;
      requestAnimationFrame(onReady);
    }
  });

  return (
    <mesh ref={mesh} frustumCulled={false}>
      <planeGeometry args={[1, 1, 24, 24]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
