"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, View, useTexture } from "@react-three/drei";
import { damp } from "@/lib/math";
import { bendFragment, bendVertex } from "./materials/bend";

const SHEET_W = 2.5;
const SHEET_H = 1.2;

type ViewProps = { src: string; imageRes: [number, number]; progress: React.RefObject<{ value: number }> };

/** Lazily loaded WebGL half of BendSheet. */
export default function BendSheetView({ src, imageRes, progress }: ViewProps) {
  return (
    <View className="absolute inset-0">
      <PerspectiveCamera makeDefault position={[0, 0, 3.4]} fov={34} />
      <Suspense fallback={null}>
        <Sheet src={src} imageRes={imageRes} progress={progress} />
      </Suspense>
    </View>
  );
}

function Sheet({
  src,
  imageRes,
  progress,
}: {
  src: string;
  imageRes: [number, number];
  progress: React.RefObject<{ value: number }>;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const tex = useTexture(src, (t) => {
    t.colorSpace = THREE.NoColorSpace;
    t.needsUpdate = true;
    invalidate();
  });
  const mesh = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>>(null);
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const [iw, ih] = imageRes;

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: bendVertex,
        fragmentShader: bendFragment,
        side: THREE.DoubleSide,
        uniforms: {
          uTex: { value: tex },
          uImageRes: { value: new THREE.Vector2(iw, ih) },
          uSheetRes: { value: new THREE.Vector2(SHEET_W, SHEET_H) },
          uBacking: { value: new THREE.Color(0xec / 255, 0xe6 / 255, 0xda / 255) },
          uBend: { value: 0 },
          uTime: { value: 0 },
          uPointer: { value: new THREE.Vector2() },
        },
      }),
    [tex, iw, ih],
  );
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, dt) => {
    const m = mesh.current;
    if (!m) return;
    const d = Math.min(dt, 0.05);
    const p = pointer.current;
    p.x = damp(p.x, p.tx, 4, d);
    p.y = damp(p.y, p.ty, 4, d);
    const u = m.material.uniforms;
    const bend = progress.current?.value ?? 0;
    u.uBend.value = bend;
    u.uTime.value = state.clock.elapsedTime;
    u.uPointer.value.set(p.x, p.y);
    m.rotation.y = -0.35 + bend * 0.9 + p.x * 0.18;
    m.rotation.x = -0.12 + p.y * 0.12;
    m.rotation.z = 0.06 - bend * 0.1;
  });

  return (
    <mesh ref={mesh} material={material}>
      <planeGeometry args={[SHEET_W, SHEET_H, 96, 24]} />
    </mesh>
  );
}
