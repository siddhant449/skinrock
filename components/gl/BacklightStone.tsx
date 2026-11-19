"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { View, useTexture } from "@react-three/drei";
import type { SiteImage } from "@/content/site";
import { damp } from "@/lib/math";
import { useGLActive } from "./GLStage";
import { backlightFragment, backlightVertex } from "./materials/backlight";

type Props = {
  image: SiteImage;
  /** 0 = lamp off, 1 = lamp on; written by the section's scroll timeline */
  intensity: React.RefObject<{ value: number }>;
  className?: string;
};

const WARM = new THREE.Color(0xf4 / 255, 0xe9 / 255, 0xd2 / 255);
const COOL = new THREE.Color(0xbf / 255, 0xe3 / 255, 0xf2 / 255);

/** Translucent stone with a pointer-driven light behind it. DOM image + CSS glow as fallback. */
export function BacklightStone({ image, intensity, className = "relative" }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const active = useGLActive();
  return (
    <div ref={wrap} data-backlight="" className={`overflow-hidden ${className}`}>
      {!active ? (
        <>
          <Image src={image.src} alt={image.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          <div aria-hidden className="backlight-fallback absolute inset-0" />
        </>
      ) : (
        <>
          <span className="sr-only">{image.alt}</span>
          <View className="absolute inset-0">
            <Suspense fallback={null}>
              <Plane src={image.src} imageRes={[image.width, image.height]} intensity={intensity} track={wrap} />
            </Suspense>
          </View>
        </>
      )}
    </div>
  );
}

function Plane({
  src,
  imageRes,
  intensity,
  track,
}: {
  src: string;
  imageRes: [number, number];
  intensity: React.RefObject<{ value: number }>;
  track: React.RefObject<HTMLDivElement | null>;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const tex = useTexture(src, (t) => {
    t.colorSpace = THREE.NoColorSpace;
    t.needsUpdate = true;
    invalidate();
  });
  const mesh = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>>(null);
  const light = useRef({ x: 0.5, y: 0.6, tx: 0.5, ty: 0.6, inside: false });
  const [iw, ih] = imageRes;

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: backlightVertex,
        fragmentShader: backlightFragment,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTex: { value: tex },
          uRes: { value: new THREE.Vector2(1, 1) },
          uImageRes: { value: new THREE.Vector2(iw, ih) },
          uLight: { value: new THREE.Vector2(0.5, 0.6) },
          uIntensity: { value: 0 },
          uTime: { value: 0 },
          uOffset: { value: 0 },
          uWarm: { value: WARM },
          uCool: { value: COOL },
        },
      }),
    [tex, iw, ih],
  );
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = track.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = 1 - (e.clientY - r.top) / r.height;
      light.current.inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      if (light.current.inside) {
        light.current.tx = x;
        light.current.ty = y;
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [track]);

  useFrame((state, dt) => {
    const m = mesh.current;
    const el = track.current;
    if (!m || !el) return;
    const d = Math.min(dt, 0.05);
    const t = state.clock.elapsedTime;
    const L = light.current;
    if (!L.inside) {
      // drift slowly when the pointer is elsewhere
      L.tx = 0.5 + Math.sin(t * 0.35) * 0.22;
      L.ty = 0.55 + Math.sin(t * 0.23 + 1.3) * 0.25;
    }
    L.x = damp(L.x, L.tx, 3, d);
    L.y = damp(L.y, L.ty, 3, d);
    const r = el.getBoundingClientRect();
    const u = m.material.uniforms;
    u.uRes.value.set(r.width, r.height);
    u.uLight.value.set(L.x, L.y);
    u.uIntensity.value = intensity.current?.value ?? 1;
    u.uTime.value = t;
    u.uOffset.value = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
  });

  return (
    <mesh ref={mesh} material={material} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
