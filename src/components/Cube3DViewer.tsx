import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { VertexId, WirePath, Point3D } from '../types/cube';
import { CUBE_VERTICES, CUBE_EDGES, ALL_VERTEX_IDS, VERTEX_NAMES } from '../utils/cubeGeometry';
import { RotateCw, Compass, Eye, Sparkles, Move3d } from 'lucide-react';

interface Cube3DViewerProps {
  wirePath: WirePath;
  activeSegmentIndex: number | null;
  onHoverSegment?: (index: number | null) => void;
  highlightedVertex?: VertexId | null;
}

export const Cube3DViewer: React.FC<Cube3DViewerProps> = ({
  wirePath,
  activeSegmentIndex,
  onHoverSegment,
  highlightedVertex,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Screen positions for 2D HTML badges overlaid on 3D vertices
  const [vertexScreenPositions, setVertexScreenPositions] = useState<
    Record<VertexId, { x: number; y: number; visible: boolean }>
  >({} as any);

  const [autoRotate, setAutoRotate] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<'iso' | 'front' | 'top' | 'side'>('iso');

  // Camera animation target
  const targetCamPos = useRef<THREE.Vector3 | null>(null);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const wireGroupRef = useRef<THREE.Group | null>(null);

  // Mouse interaction state for orbit control
  const isDragging = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef({ radius: 4.8, theta: Math.PI / 4, phi: Math.PI / 3 });

  // Update camera position from spherical coordinates
  const updateCameraFromSpherical = useCallback(() => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = sphericalRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
  }, []);

  // Set camera to preset angle smoothly
  const setCameraPreset = (preset: 'iso' | 'front' | 'top' | 'side') => {
    setCurrentPreset(preset);
    let target = new THREE.Vector3(0, 0, 0);
    if (preset === 'iso') {
      sphericalRef.current = { radius: 4.8, theta: Math.PI / 4, phi: Math.PI / 3.2 };
    } else if (preset === 'front') {
      // Direct front view (Nárys)
      sphericalRef.current = { radius: 4.6, theta: 0.0001, phi: Math.PI / 2 };
    } else if (preset === 'top') {
      // Direct top view (Půdorys)
      sphericalRef.current = { radius: 4.6, theta: 0.0001, phi: 0.001 };
    } else if (preset === 'side') {
      // Direct side view (Bokorys)
      sphericalRef.current = { radius: 4.6, theta: Math.PI / 2, phi: Math.PI / 2 };
    }
    updateCameraFromSpherical();
  };

  // Setup Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraFromSpherical();

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // Ambient and Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x60a5fa, 1.4);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf472b6, 0.8);
    dirLight2.position.set(-5, -4, -4);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x38bdf8, 1.2, 10);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    // Cube base structure: semi-transparent cube body
    const cubeGeom = new THREE.BoxGeometry(2, 2, 2);
    const cubeMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.12,
      roughness: 0.2,
      transmission: 0.6,
      depthWrite: false,
    });
    const cubeMesh = new THREE.Mesh(cubeGeom, cubeMat);
    scene.add(cubeMesh);

    // Cube wireframe edges (12 edges)
    const edgeGroup = new THREE.Group();
    CUBE_EDGES.forEach(([v1, v2]) => {
      const p1 = CUBE_VERTICES[v1];
      const p2 = CUBE_VERTICES[v2];

      const start = new THREE.Vector3(p1.x, p1.y, p1.z);
      const end = new THREE.Vector3(p2.x, p2.y, p2.z);
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();

      const cylinderGeom = new THREE.CylinderGeometry(0.018, 0.018, length, 12);
      const cylinderMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.4,
        roughness: 0.3,
      });
      const edgeMesh = new THREE.Mesh(cylinderGeom, cylinderMat);

      // Orient cylinder
      edgeMesh.position.copy(start).addScaledVector(direction, 0.5);
      edgeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
      edgeGroup.add(edgeMesh);
    });
    scene.add(edgeGroup);

    // Vertex spheres
    const vertexGroup = new THREE.Group();
    ALL_VERTEX_IDS.forEach(vId => {
      const p = CUBE_VERTICES[vId];
      const sphereGeom = new THREE.SphereGeometry(0.065, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
        metalness: 0.6,
        roughness: 0.2,
      });
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.position.set(p.x, p.y, p.z);
      vertexGroup.add(sphere);
    });
    scene.add(vertexGroup);

    // Wire group container for dynamic wire path
    const wireGroup = new THREE.Group();
    wireGroupRef.current = wireGroup;
    scene.add(wireGroup);

    // Subtle coordinate ground grid under cube
    const gridHelper = new THREE.GridHelper(4, 8, 0x334155, 0x1e293b);
    gridHelper.position.y = -1.02;
    scene.add(gridHelper);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate && !isDragging.current) {
        sphericalRef.current.theta += 0.008;
        updateCameraFromSpherical();
      }

      renderer.render(scene, camera);

      // Compute 2D screen positions for vertex labels
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const positions: Record<VertexId, { x: number; y: number; visible: boolean }> = {} as any;

        ALL_VERTEX_IDS.forEach(vId => {
          const p = CUBE_VERTICES[vId];
          const v3 = new THREE.Vector3(p.x, p.y, p.z);
          v3.project(camera);

          // Convert to CSS pixels relative to container
          const x = (v3.x * 0.5 + 0.5) * rect.width;
          const y = (-(v3.y * 0.5) + 0.5) * rect.height;
          const visible = v3.z < 1.0;

          positions[vId] = { x, y, visible };
        });

        setVertexScreenPositions(positions);
      }
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [updateCameraFromSpherical, autoRotate]);

  // Update 3D wire mesh whenever wirePath or activeSegmentIndex changes
  useEffect(() => {
    if (!wireGroupRef.current) return;
    const group = wireGroupRef.current;

    // Clear old wire meshes
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) {
        if (Array.isArray((child as any).material)) {
          (child as any).material.forEach((m: any) => m.dispose());
        } else {
          (child as any).material.dispose();
        }
      }
    }

    if (!wirePath || wirePath.segments.length === 0) return;

    // Colors
    const defaultColor = 0xf59e0b; // Amber-500
    const activeColor = 0xef4444; // Red-500 / bright highlight
    const startColor = 0x10b981; // Emerald-500
    const endColor = 0xa855f7; // Purple-500

    wirePath.segments.forEach((seg, idx) => {
      const p1 = CUBE_VERTICES[seg.from];
      const p2 = CUBE_VERTICES[seg.to];
      const start = new THREE.Vector3(p1.x, p1.y, p1.z);
      const end = new THREE.Vector3(p2.x, p2.y, p2.z);

      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      const isActive = activeSegmentIndex === idx;

      // Thicker tube for wire
      const radius = isActive ? 0.055 : 0.04;
      const cylinderGeom = new THREE.CylinderGeometry(radius, radius, length, 16);

      const segmentColor = isActive
        ? activeColor
        : idx === 0
        ? defaultColor
        : defaultColor;

      const cylinderMat = new THREE.MeshStandardMaterial({
        color: segmentColor,
        emissive: isActive ? 0xd97706 : 0x78350f,
        emissiveIntensity: isActive ? 0.8 : 0.4,
        roughness: 0.15,
        metalness: 0.75,
      });

      const mesh = new THREE.Mesh(cylinderGeom, cylinderMat);
      mesh.position.copy(start).addScaledVector(direction, 0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
      group.add(mesh);

      // Add a small mid-point number bead or arrow
      const midSphereGeom = new THREE.SphereGeometry(radius * 1.3, 12, 12);
      const midSphereMat = new THREE.MeshStandardMaterial({
        color: isActive ? 0xfecaca : 0xfde68a,
        metalness: 0.5,
        roughness: 0.2,
      });
      const midSphere = new THREE.Mesh(midSphereGeom, midSphereMat);
      midSphere.position.copy(start).addScaledVector(direction, 0.5);
      group.add(midSphere);
    });

    // Add glowing vertex caps for visited vertices
    wirePath.vertices.forEach((vId, idx) => {
      const p = CUBE_VERTICES[vId];
      const isStart = idx === 0;
      const isEnd = idx === wirePath.vertices.length - 1;

      let radius = 0.085;
      let color = 0xf59e0b;
      let emissive = 0xb45309;

      if (isStart) {
        radius = 0.11;
        color = startColor;
        emissive = 0x059669;
      } else if (isEnd) {
        radius = 0.11;
        color = endColor;
        emissive = 0x7e22ce;
      }

      const sphereGeom = new THREE.SphereGeometry(radius, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: 0.8,
        metalness: 0.5,
        roughness: 0.2,
      });
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.position.set(p.x, p.y, p.z);
      group.add(sphere);
    });
  }, [wirePath, activeSegmentIndex]);

  // Mouse & Touch interaction handlers for orbit controls
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;

    const deltaX = e.clientX - prevMousePos.current.x;
    const deltaY = e.clientY - prevMousePos.current.y;
    prevMousePos.current = { x: e.clientX, y: e.clientY };

    // Rotate spherical coordinates
    sphericalRef.current.theta -= deltaX * 0.01;
    sphericalRef.current.phi = Math.max(
      0.05,
      Math.min(Math.PI - 0.05, sphericalRef.current.phi - deltaY * 0.01)
    );

    updateCameraFromSpherical();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    sphericalRef.current.radius = Math.max(
      3.0,
      Math.min(7.5, sphericalRef.current.radius + e.deltaY * 0.003)
    );
    updateCameraFromSpherical();
  };

  // Wire path string for display
  const pathSummary = wirePath.vertices.join(' → ');

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col bg-slate-950 select-none overflow-hidden"
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing block touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* 2D Projected Vertex Badges */}
      <div className="absolute inset-0 pointer-events-none">
        {ALL_VERTEX_IDS.map(vId => {
          const pos = vertexScreenPositions[vId];
          if (!pos || !pos.visible) return null;

          const isVisited = wirePath.vertices.includes(vId);
          const isStart = wirePath.vertices[0] === vId;
          const isEnd = wirePath.vertices[wirePath.vertices.length - 1] === vId;
          const isHighlighted = highlightedVertex === vId;

          let badgeBg = 'bg-slate-900/80 text-slate-300 border-slate-700';
          if (isStart) {
            badgeBg = 'bg-emerald-600 text-white border-emerald-300 font-bold shadow-lg shadow-emerald-950/80 scale-110';
          } else if (isEnd) {
            badgeBg = 'bg-purple-600 text-white border-purple-300 font-bold shadow-lg shadow-purple-950/80 scale-110';
          } else if (isVisited) {
            badgeBg = 'bg-amber-500 text-slate-950 border-amber-300 font-bold shadow-md shadow-amber-950/80';
          }

          if (isHighlighted) {
            badgeBg += ' ring-4 ring-cyan-400 scale-125 z-20';
          }

          return (
            <div
              key={vId}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute pointer-events-auto transition-transform duration-75"
              title={VERTEX_NAMES[vId]}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border shadow-sm ${badgeBg} cursor-help transition-all`}
              >
                {vId}
              </div>
              {isStart && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-wider font-extrabold text-emerald-400 bg-slate-950/90 px-1 py-0.5 rounded border border-emerald-500/40 pointer-events-none whitespace-nowrap">
                  Start
                </div>
              )}
              {isEnd && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-wider font-extrabold text-purple-400 bg-slate-950/90 px-1 py-0.5 rounded border border-purple-500/40 pointer-events-none whitespace-nowrap">
                  Cíl
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Top Overlay Badge: Title & Rotation hint */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-200">3D Drátěná krychle</span>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              {wirePath.segments.length} segmentů
            </span>
          </div>
          <div className="text-[11px] font-mono text-amber-300 mt-1 truncate max-w-xs sm:max-w-sm">
            {pathSummary}
          </div>
        </div>

        <div className="flex items-center gap-1 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded transition flex items-center gap-1 ${
              autoRotate
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Přepnout automatické otáčení"
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-[11px]">Rotovat</span>
          </button>
        </div>
      </div>

      {/* Bottom Overlay: Camera View Presets */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 pointer-events-auto">
          <span className="text-[11px] text-slate-400 px-2 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            Pohled:
          </span>
          <button
            onClick={() => setCameraPreset('iso')}
            className={`px-2 py-1 rounded text-xs font-medium transition ${
              currentPreset === 'iso'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Izometrie
          </button>
          <button
            onClick={() => setCameraPreset('front')}
            className={`px-2 py-1 rounded text-xs font-medium transition ${
              currentPreset === 'front'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Přímý pohled zepředu (Nárys)"
          >
            Zepředu (Nárys)
          </button>
          <button
            onClick={() => setCameraPreset('top')}
            className={`px-2 py-1 rounded text-xs font-medium transition ${
              currentPreset === 'top'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Přímý pohled shora (Půdorys)"
          >
            Shora (Půdorys)
          </button>
          <button
            onClick={() => setCameraPreset('side')}
            className={`px-2 py-1 rounded text-xs font-medium transition ${
              currentPreset === 'side'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Přímý pohled z boku (Bokorys)"
          >
            Z boku (Bokorys)
          </button>
        </div>

        <div className="text-[11px] text-slate-400 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 hidden md:flex items-center gap-1.5">
          <Move3d className="w-3.5 h-3.5 text-slate-400" />
          <span>Tažením myši otáčejte • Kolečkem zoom</span>
        </div>
      </div>
    </div>
  );
};
