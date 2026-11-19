"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { View, useTexture } from "@react-three/drei";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";
import type { SiteImage } from "@/content/site";
import { onLoaded } from "@/lib/loaded";
import { useGLActive } from "./GLStage";
import { useScrollVelocity } from "./useScrollVelocity";
import { GRADE_INK, stoneFragment, stoneVertex } from "./materials/stone";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  image: SiteImage;
  /** must include positioning (relative or absolute) and a size */
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** 0 to 1: how far shadows are pulled toward the palette's ink blue. */
  grade?: number;
  /** extra zoom used for in-frame parallax drift. */
  parallax?: number;
  /** "scroll" reveals when entering view, "load" after the intro, "none" shows immediately. */
  revealOn?: "scroll" | "load" | "none";
};

/**
 * A real <img> (SEO, fallback, LCP) mirrored by a WebGL plane on the shared canvas.
 * Once the plane has drawn, the DOM image fades out and the shader takes over.
 */
export function GLImage({
  image,
  className = "relative",
  sizes = "100vw",
  priority,
  grade = 0.38,
  parallax = 0.08,
  revealOn = "scroll",
}: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const active = useGLActive();
  const [ready, setReady] = useState(false);
  const reveal = useRef({ value: revealOn === "none" ? 1 : 0 });

  useEffect(() => {
    if (!active || !ready || !wrap.current || revealOn === "none") return;
    const el = wrap.current;
    const play = () =>
      gsap.to(reveal.current, { value: 1, duration: 1.8, ease: "expo.out" });
    if (revealOn === "load") return onLoaded(play);
    const r = el.getBoundingClientRect();
    // already on screen when WebGL arrives: no flicker, just show it
    if (r.top < window.innerHeight && r.bottom > 0) {
      reveal.current.value = 1;
      return;
    }
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      once: true,
      onEnter: play,
    });
    return () => st.kill();
  }, [active, ready, revealOn]);

  return (
    <div
      ref={wrap}
      data-gl-image=""
      data-gl={active && ready ? "ready" : undefined}
      className={`gl-image overflow-hidden ${className}`}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover transition-opacity duration-300"
      />
      {active && (
        <View className="absolute inset-0">
          <Suspense fallback={null}>
            <StonePlane
              src={image.src}
              imageWidth={image.width}
              imageHeight={image.height}
              grade={grade}
              parallax={parallax}
              reveal={reveal}
              track={wrap}
              onReady={() => setReady(true)}
            />
          </Suspense>
        </View>
      )}
    </div>
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
  const tex = useTexture(src);
  const velocity = useScrollVelocity();
  const invalidate = useThree((s) => s.invalidate);
  const readyOnce = useRef(false);

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
  const uniforms = material.uniforms;
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    tex.colorSpace = THREE.NoColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    invalidate();
  }, [tex, invalidate]);

  useFrame((state) => {
    const el = track.current;
    if (!el) return;
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
    <mesh frustumCulled={false}>
      <planeGeometry args={[1, 1, 24, 24]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
