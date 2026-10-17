import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { JetPlaneAsset } from './JetPlaneAsset';
import { interpolateStoryProgress } from '../utils/aircraftMath';
import { jetAudio } from '../utils/audioAmbiance';
import { Plane } from 'lucide-react';
import { CameraMode } from './ControlOverlay';

interface JeskoHeroSceneProps {
  progress: number;
  onProgressChange: (p: number) => void;
  onOpenBooking: () => void;
  cameraMode: CameraMode;
  activeColorHex: number;
}

export const JeskoHeroScene: React.FC<JeskoHeroSceneProps> = ({
  progress,
  onProgressChange,
  onOpenBooking,
  cameraMode,
  activeColorHex,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mutable refs for Three.js animation loop to prevent React re-render lag
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    plane: JetPlaneAsset;
    keyLight: THREE.DirectionalLight;
    fillLight: THREE.DirectionalLight;
    mouseParallax: { x: number; y: number };
    orbitAngles: { theta: number; phi: number; radius: number };
    isDraggingOrbit: boolean;
    lastMouse: { x: number; y: number };
    animId: number;
  } | null>(null);

  const progressRef = useRef(progress);
  progressRef.current = progress;

  const cameraModeRef = useRef(cameraMode);
  cameraModeRef.current = cameraMode;

  const activeColorHexRef = useRef(activeColorHex);
  activeColorHexRef.current = activeColorHex;

  // Initialize Three.js scene once
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    // Detect headless CPU WebGL to optimize frame rate
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xcfe0ef, 0.035);
    (window as unknown as { THREE?: unknown }).THREE = THREE;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 8.6);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    // Studio Environment Reflections using RoomEnvironment
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Studio Directional Sun Key Light & Sky Rim Lights
    const keyLight = new THREE.DirectionalLight(0xfff8ed, 3.8);
    keyLight.position.set(7, 9, 6);
    keyLight.castShadow = !isHeadless;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 25;
      keyLight.shadow.camera.left = -6;
      keyLight.shadow.camera.right = 6;
      keyLight.shadow.camera.top = 6;
      keyLight.shadow.camera.bottom = -6;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8eb9e5, 1.8);
    fillLight.position.set(-7, 2, -4);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0xe4effa, 0x0f172a, 1.2);
    scene.add(hemiLight);

    // High-Fidelity Gulfstream G650ER Jet Model
    const plane = new JetPlaneAsset(renderer);
    scene.add(plane.group);
    (window as unknown as { __PLANE__?: unknown }).__PLANE__ = plane;

    // Soft Contact Shadow Grounding underneath
    const contactShadowGeo = new THREE.PlaneGeometry(10, 10);
    const contactCanvas = document.createElement('canvas');
    contactCanvas.width = 256;
    contactCanvas.height = 256;
    const ctx = contactCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
      grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.15)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(contactCanvas);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const contactShadowMesh = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    contactShadowMesh.rotation.x = -Math.PI / 2;
    contactShadowMesh.position.y = -1.5;
    plane.group.add(contactShadowMesh);

    // Mouse Parallax & Orbit Interaction State
    const mouseParallax = { x: 0, y: 0 };
    const orbitAngles = { theta: 0.1, phi: Math.PI / 3, radius: 8.5 };
    const lastMouse = { x: 0, y: 0 };
    let isDraggingOrbit = false;

    // Pointer event listeners for mouse parallax & orbit
    const handlePointerMove = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      mouseParallax.x = nx;
      mouseParallax.y = ny;

      if (cameraModeRef.current === 'orbit' && isDraggingOrbit) {
        const dx = e.clientX - lastMouse.x;
        const dy = e.clientY - lastMouse.y;
        orbitAngles.theta -= dx * 0.008;
        orbitAngles.phi = THREE.MathUtils.clamp(
          orbitAngles.phi - dy * 0.008,
          0.15,
          Math.PI / 2 - 0.05
        );
        lastMouse.x = e.clientX;
        lastMouse.y = e.clientY;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (cameraModeRef.current === 'orbit') {
        isDraggingOrbit = true;
        lastMouse.x = e.clientX;
        lastMouse.y = e.clientY;
      }
    };

    const handlePointerUp = () => {
      isDraggingOrbit = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (cameraModeRef.current === 'orbit') {
        orbitAngles.radius = THREE.MathUtils.clamp(
          orbitAngles.radius + e.deltaY * 0.006,
          4.5,
          15
        );
      }
    };

    mount.addEventListener('pointermove', handlePointerMove);
    mount.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    mount.addEventListener('wheel', handleWheel, { passive: true });

    // Window Resize Handler
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Debug helper to inspect scene objects
    (window as unknown as { __GET_MESHES__?: () => unknown }).__GET_MESHES__ = () => {
      const list: unknown[] = [];
      scene.traverse((obj: THREE.Object3D) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          const box = new THREE.Box3().setFromObject(mesh);
          const center = new THREE.Vector3();
          const size = new THREE.Vector3();
          box.getCenter(center);
          box.getSize(size);
          list.push({
            type: mesh.geometry.type,
            pos: { x: +mesh.position.x.toFixed(2), y: +mesh.position.y.toFixed(2), z: +mesh.position.z.toFixed(2) },
            center: { x: +center.x.toFixed(2), y: +center.y.toFixed(2), z: +center.z.toFixed(2) },
            size: { x: +size.x.toFixed(2), y: +size.y.toFixed(2), z: +size.z.toFixed(2) },
            visible: mesh.visible,
          });
        }
      });
      return list;
    };

    // Animation Loop
    const clock = new THREE.Clock();
    let animId = 0;

    const tick = () => {
      animId = requestAnimationFrame(tick);
      const delta = clock.getDelta();

      // Continuous turbine rotation
      plane.animate(delta);

      const p = progressRef.current;
      const timeline = interpolateStoryProgress(p);

      // Morph aircraft between solid PBR and architectural schematic
      plane.updateMorph(timeline.solidOpacity, timeline.schematicOpacity, activeColorHexRef.current);
      contactShadowMesh.visible = p < 0.35 && timeline.solidOpacity > 0.1;

      if (cameraModeRef.current === 'orbit') {
        // Orbit camera view
        const r = orbitAngles.radius;
        const sinPhi = Math.sin(orbitAngles.phi);
        const cosPhi = Math.cos(orbitAngles.phi);
        const sinTheta = Math.sin(orbitAngles.theta);
        const cosTheta = Math.cos(orbitAngles.theta);

        const targetCamX = r * sinPhi * sinTheta;
        const targetCamY = r * cosPhi;
        const targetCamZ = r * sinPhi * cosTheta;

        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 6.0, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 6.0, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 6.0, delta);
        camera.lookAt(0, 0, 0);

        // Keep plane steady in center for 3D inspection
        plane.group.position.set(0, 0, 0);
        plane.group.rotation.set(0, 0, 0);
        plane.group.scale.setScalar(1.0);
      } else {
        // Story Mode: Synchronize plane and camera position/rotation exactly with the video story
        let targetPlaneY = timeline.planeY;
        let targetPlaneZ = timeline.planeZ;
        let targetRotX = timeline.rotX;
        let targetRotY = timeline.rotY;
        let targetRotZ = timeline.rotZ;

        // Subtle aerodynamic mouse parallax when at the top hero section
        if (p < 0.28) {
          targetRotX += -mouseParallax.y * 0.12;
          targetRotY += mouseParallax.x * 0.16;
          targetRotZ += -mouseParallax.x * 0.08;
        }

        // Exponential damping for silky smooth motion
        plane.group.position.y = THREE.MathUtils.damp(plane.group.position.y, targetPlaneY, 5.0, delta);
        plane.group.position.z = THREE.MathUtils.damp(plane.group.position.z, targetPlaneZ, 5.0, delta);
        plane.group.rotation.x = THREE.MathUtils.damp(plane.group.rotation.x, targetRotX, 5.0, delta);
        plane.group.rotation.y = THREE.MathUtils.damp(plane.group.rotation.y, targetRotY, 5.0, delta);
        plane.group.rotation.z = THREE.MathUtils.damp(plane.group.rotation.z, targetRotZ, 5.0, delta);
        plane.group.scale.setScalar(timeline.scale);

        // Camera positioning across the stages
        if (p < 0.50) {
          // Perspective angle looking slightly down on the ascending jet
          camera.up.set(0, 1, 0);
          camera.position.x = THREE.MathUtils.damp(camera.position.x, 0, 5.0, delta);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, 2.0, 5.0, delta);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, 8.4, 5.0, delta);
          camera.lookAt(0, 0.4, 0);
        } else {
          // Top-down technical drafting view (nose points up, camera looks down -Y)
          camera.up.set(0, 0, -1);
          camera.position.x = THREE.MathUtils.damp(camera.position.x, 0, 5.0, delta);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, 8.5, 5.0, delta);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, 0, 5.0, delta);
          camera.lookAt(0, 0, 0);
        }

        // Adjust lighting based on background (sky vs paper)
        if (p > 0.35) {
          scene.fog.color.setHex(0xdfd8cc);
          keyLight.intensity = THREE.MathUtils.damp(keyLight.intensity, 2.8, 4.0, delta);
          fillLight.intensity = THREE.MathUtils.damp(fillLight.intensity, 1.4, 4.0, delta);
        } else {
          scene.fog.color.setHex(0xcfe0ef);
          keyLight.intensity = THREE.MathUtils.damp(keyLight.intensity, 3.8, 4.0, delta);
          fillLight.intensity = THREE.MathUtils.damp(fillLight.intensity, 1.8, 4.0, delta);
        }
      }

      // Audio feedback based on velocity/scrubbing
      jetAudio.updateFlightSpeed(p);

      renderer.render(scene, camera);
    };

    tick();

    sceneRef.current = {
      renderer,
      scene,
      camera,
      plane,
      keyLight,
      fillLight,
      mouseParallax,
      orbitAngles,
      isDraggingOrbit,
      lastMouse,
      animId,
    };

    return () => {
      cancelAnimationFrame(animId);
      mount.removeEventListener('pointermove', handlePointerMove);
      mount.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      mount.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      plane.dispose();
      renderer.dispose();
    };
  }, []);

  // Compute CSS Opacities and Transforms based on progress
  const timeline = interpolateStoryProgress(progress);

  // Stage 1: Hero text opacities
  const heroOpacity = Math.max(0, 1 - progress / 0.24);
  const heroTranslateX = (progress / 0.24) * 80;

  // Stage 2: Specs opacities
  const specsOpacity =
    progress >= 0.25 && progress <= 0.65
      ? Math.min(1, (progress - 0.25) / 0.12) * Math.min(1, (0.65 - progress) / 0.12)
      : 0;

  // Stage 3: Schematic Callout opacities
  const schematicCalloutOpacity =
    progress >= 0.58 && progress <= 0.85
      ? Math.min(1, (progress - 0.58) / 0.1) * Math.min(1, (0.85 - progress) / 0.1)
      : 0;

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden">
      {/* Dynamic Background: Sky Blue to Sand Architectural Paper */}
      <div
        className="absolute inset-0 transition-opacity duration-700 ease-out pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, #eaf4fd 0%, #cde1f2 50%, #b2cee6 100%)',
          opacity: timeline.skyOpacity,
        }}
      >
        {/* Soft atmospheric cloud layers */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.7)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.5)_0%,transparent_50%)] pointer-events-none" />
      </div>

      <div
        className="absolute inset-0 transition-opacity duration-700 ease-out pointer-events-none"
        style={{
          backgroundColor: '#dfd8cc',
          backgroundImage: `
            radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
            linear-gradient(to right, rgba(0, 0, 0, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px, 120px 120px, 120px 120px',
          opacity: timeline.paperOpacity,
        }}
      />

      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 z-10 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* HTML Overlays Synchronized Frame-by-Frame */}

      {/* 1. HERO PHASE (00:00 - 00:08) */}
      <div
        className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between px-6 sm:px-16 pt-28 pb-20 transition-opacity duration-300"
        style={{ opacity: heroOpacity }}
      >
        <div className="w-full flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Left Hero Title */}
          <div
            className="transition-transform duration-300"
            style={{ transform: `translateX(-${heroTranslateX}px)` }}
          >
            <h1 className="font-serif text-6xl sm:text-8xl lg:text-9xl font-bold tracking-tight text-[#141920] leading-[0.9]">
              Fly in
            </h1>
            <p className="font-sans text-base sm:text-xl font-light text-[#222] mt-4 tracking-wide max-w-xs">
              Luxury that moves with you
            </p>
          </div>

          {/* Right Hero Title & Jet Intro */}
          <div
            className="text-right max-w-md transition-transform duration-300"
            style={{ transform: `translateX(${heroTranslateX}px)` }}
          >
            <h2 className="font-serif text-6xl sm:text-8xl lg:text-9xl font-bold tracking-tight text-[#141920] leading-[0.9]">
              Luxury
            </h2>
            <div className="mt-6 text-left sm:text-right">
              <div className="flex items-center justify-start sm:justify-end gap-3 text-xs font-mono font-semibold tracking-wider text-[#333] uppercase">
                <span>Gulfstream 650ER</span>
                <span className="text-[#888]">·</span>
                <span className="text-[#666]">03/2019</span>
              </div>
              <p className="mt-3 text-xs sm:text-sm text-[#444] font-sans font-light leading-relaxed">
                Featuring wings designed to minimize anything that could disrupt its natural aerodynamic balance, and powered by high-thrust Rolls-Royce BR725 A1-12 engines, the Gulfstream G650 is engineered for exceptional range and top-end speed.
              </p>
            </div>
          </div>
        </div>

        {/* Floating Bottom Action Pill: "Book the Flight" */}
        <div className="w-full flex justify-center pb-28 pointer-events-none">
          <button
            onClick={onOpenBooking}
            data-testid="book-flight-btn"
            className="pointer-events-auto group px-7 py-3 rounded-full bg-white text-[#121417] shadow-xl hover:shadow-2xl border border-black/5 hover:border-black/20 flex items-center gap-3 transition-all duration-300 hover:scale-105 cursor-pointer"
          >
            <span className="text-sm font-sans font-medium tracking-wide">Book the Flight</span>
            <span className="w-7 h-7 rounded-full bg-[#1b222c] text-white flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
              <Plane className="w-3.5 h-3.5 -rotate-45" />
            </span>
          </button>
        </div>
      </div>

      {/* 2. SPECIFICATIONS PHASE (00:17 - 00:23) */}
      <div
        className="absolute inset-0 z-20 pointer-events-none px-6 sm:px-14 pt-24 pb-16 flex flex-col justify-between transition-opacity duration-300"
        style={{ opacity: specsOpacity }}
      >
        {/* Top Header Specs Line */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-mono tracking-widest text-[#777] uppercase">
              Gulfstream
            </div>
            <h3 className="font-serif text-5xl sm:text-7xl font-bold text-[#141920] tracking-tight">
              650ER
            </h3>
          </div>

          <div className="text-right max-w-sm">
            <h4 className="font-serif text-2xl sm:text-3xl text-[#141920] font-normal">
              Ultra-long-range Aircraft
            </h4>
            <div className="text-[10px] font-mono tracking-widest uppercase text-[#666] mt-1">
              Direct Access to Private Travel
            </div>
            <p className="text-xs sm:text-sm text-[#4a5058] mt-3 font-sans leading-relaxed">
              A true time-saving machine: it brings Tokyo and New York an hour closer, and at 92% of the speed of sound, it can circle the globe with just a single stop.
            </p>
          </div>
        </div>

        {/* Technical Data Columns (Left Flank) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-md">
          <div className="space-y-4 text-xs font-mono">
            <div>
              <div className="text-[10px] uppercase text-[#777] tracking-wider">
                Maximum Operating Range
              </div>
              <div className="text-xl font-bold text-[#141920] font-serif">11,260 KM</div>
            </div>

            <div>
              <div className="text-[10px] uppercase text-[#777] tracking-wider">
                Cruising Speed
              </div>
              <div className="text-xl font-bold text-[#141920] font-serif">490 KNOTS</div>
            </div>

            <div>
              <div className="text-[10px] uppercase text-[#777] tracking-wider">
                Capacity
              </div>
              <div className="text-sm font-semibold text-[#141920]">
                UP TO 12 SEATS + 1 CABIN SERVICE
              </div>
              <div className="text-[10px] text-[#666]">
                14 HRS MAXIMUM FOR EUROPEAN BASED AIRCRAFT
              </div>
            </div>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <div className="text-[10px] uppercase text-[#777] tracking-wider">
                Baggage Capacity
              </div>
              <div className="text-xl font-bold text-[#141920] font-serif">5.52 M³</div>
            </div>

            <div>
              <div className="text-[10px] uppercase text-[#777] tracking-wider">
                Cruising Altitude
              </div>
              <div className="text-xl font-bold text-[#141920] font-serif">15,544 M</div>
            </div>

            <div>
              <div className="text-[10px] uppercase text-[#777] tracking-wider">
                Specification
              </div>
              <div className="text-[11px] text-[#333] space-y-0.5">
                <div>CABIN LENGTH: 14.05 M</div>
                <div>CABIN WIDTH: 2.49 M</div>
                <div>CABIN HEIGHT: 1.92 M</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ARCHITECTURAL SCHEMATIC CABIN CUTAWAY PHASE (00:21 - 00:24) */}
      <div
        className="absolute inset-0 z-20 pointer-events-none px-6 sm:px-14 pt-24 pb-20 flex flex-col justify-between transition-opacity duration-300"
        style={{ opacity: schematicCalloutOpacity }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#666] uppercase">
              Architectural Technical Schematic
            </div>
            <h4 className="font-serif text-3xl sm:text-4xl text-[#141920] font-bold">
              Cabin Floorplan & Interior Architecture
            </h4>
          </div>
          <div className="text-right font-mono text-xs text-[#555]">
            <div>SCALE: 1:50 TECHNICAL DRAFTING</div>
            <div className="text-[10px] text-[#777]">FOUR-ZONE LIVING SUITE</div>
          </div>
        </div>

        {/* Zone Markers on Flanks */}
        <div className="flex justify-between items-end text-xs font-mono">
          <div className="space-y-2 bg-[#ece6dc]/80 backdrop-blur-sm p-3 rounded-lg border border-[#d2caba]/80">
            <div className="font-bold text-[#141920]">ZONE BREAKDOWN</div>
            <div className="text-[11px] text-[#444]">01 · Flight Deck Avionics & Crew Rest</div>
            <div className="text-[11px] text-[#444]">02 · Forward Executive 4-Place Club Suite</div>
            <div className="text-[11px] text-[#444]">03 · Mid-Cabin Conference & Dining Group</div>
            <div className="text-[11px] text-[#444]">04 · Aft Private Stateroom & Lavatory</div>
          </div>

          <div className="text-right space-y-1">
            <div className="text-[10px] text-[#777]">TOTAL LIVING VOLUME</div>
            <div className="text-lg font-serif font-bold text-[#141920]">60.77 M³</div>
          </div>
        </div>
      </div>
    </div>
  );
};
