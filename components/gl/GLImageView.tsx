"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { textureUrl, textureWidth } from "@/lib/textureSize";
import { useScrollVelocity } from "./useScrollVelocity";
import { useStoneTexture } from "./useStoneTexture";
import { GRADE_INK, stoneFragment, stoneVertex } from "./materials/stone";

/** Lazily loaded WebGL half of GLImage: a View tracking the shell's box. */
export default function GLImageView(props: Omit<PlaneProps, "url">) {
  // the texture is fetched at the size it is drawn (parallax zooms in by 1 + 2 * parallax)
  const [url] = useState(() => {
    const r = props.track.current?.getBoundingClientRect();
    const w = textureWidth({
      boxWidth: r?.width ?? props.imageWidth,
      boxHeight: r?.height ?? props.imageHeight,
      imageWidth: props.imageWidth,
      imageHeight: props.imageHeight,
      devicePixelRatio: window.devicePixelRatio,
      zoom: 1 + props.parallax * 2,
    });
    return textureUrl(props.src, w);
  });
  return (
    <View className="absolute inset-0" data-gl-view="">
      <Suspense fallback={null}>
        <StonePlane {...props} url={url} />
      </Suspense>
    </View>
  );
}

type PlaneProps = {
  src: string;
  url: string;
  imageWidth: number;
  imageHeight: number;
  grade: number;
  parallax: number;
  reveal: React.RefObject<{ value: number }>;
  track: React.RefObject<HTMLDivElement | null>;
  onReady: () => void;
};

function StonePlane({
  url,
  imageWidth,
  imageHeight,
  grade,
  parallax,
  reveal,
  track,
  onReady,
}: PlaneProps) {
  // raw pass-through: the shader works on the photo's stored values
  const tex = useStoneTexture(url, { mipmaps: false });
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
