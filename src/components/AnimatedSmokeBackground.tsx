"use client";

import { useEffect, useRef, useCallback } from "react";

// =============================================================================
// TYPES
// =============================================================================

type DepthLayer = "far" | "mid" | "near";

type Wisp = {
  offsetAngle: number;
  offsetDist: number;
  scale: number;
  phase: number;
  brightness: number;
};

type SmokeCloud = {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  phase: number;
  speed: number;
  depth: number;
  layer: DepthLayer;
  turbulenceOffset: number;
  wisps: Wisp[];
  rotation: number;
  rotationSpeed: number;
};

type MouseState = {
  x: number;
  y: number;
  active: boolean;
};

// =============================================================================
// CLARITY PARAMETERS — CONTROLS SHARPNESS & DEFINITION
// =============================================================================

const CLARITY = {
  // ══════════════════════════════════════════════════════════════════════════
  // EDGE DEFINITION (lower = sharper, more defined edges)
  // ══════════════════════════════════════════════════════════════════════════
  edgeSharpness: {
    far: 0.3,       // Soft, atmospheric
    mid: 0.55,      // Moderate definition
    near: 0.8,      // Sharp, readable edges
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INTERNAL CONTRAST (creates visible structure inside clouds)
  // ══════════════════════════════════════════════════════════════════════════
  coreContrast: 0.85,        // How bright the core is vs edges
  ringContrast: 0.5,         // Creates visible "rings" in smoke
  luminanceVariation: 0.4,   // Brightness variation across cloud

  // ══════════════════════════════════════════════════════════════════════════
  // INTERNAL WISPS (sub-structures that create texture)
  // ══════════════════════════════════════════════════════════════════════════
  wispCount: 5,              // More wisps = more internal detail
  wispVisibility: 0.7,       // How visible internal structure is
  wispSharpness: 1.2,        // Wisps sharper than parent (multiplier)

  // ══════════════════════════════════════════════════════════════════════════
  // DEPTH SEPARATION (visual difference between layers)
  // ══════════════════════════════════════════════════════════════════════════
  depthContrast: {
    far: 0.5,       // Dimmer, less contrast
    mid: 0.8,       // Medium
    near: 1.0,      // Full contrast
  },
} as const;

// =============================================================================
// INTENSITY PARAMETERS
// =============================================================================

const INTENSITY = {
  // OPACITY — moderate base, contrast does the work
  baseOpacity: 0.25,

  // CLOUD COUNTS
  farLayerCount: 4,
  midLayerCount: 6,
  nearLayerCount: 5,

  // LAYER SIZES
  layers: {
    far: { minRadius: 180, maxRadius: 350, opacity: 0.6, speed: 1.2 },
    mid: { minRadius: 250, maxRadius: 450, opacity: 0.85, speed: 0.9 },
    near: { minRadius: 300, maxRadius: 550, opacity: 0.75, speed: 0.6 },
  },

  // COLORS — Gray tones, NOT white (key for definition)
  backgroundColor: "#010102",
  colors: {
    core: { r: 210, g: 210, b: 218 },      // Light gray core
    mid: { r: 150, g: 150, b: 160 },       // Medium gray body
    edge: { r: 70, g: 70, b: 80 },         // Dark gray edge
    highlight: { r: 235, g: 235, b: 245 }, // Bright highlights
  },

  // MOTION
  driftSpeed: 0.0006,
  driftAmplitude: 100,
  turbulenceStrength: 0.3,
  breathingAmount: 0.08,

  // CURSOR
  mouseRadius: 400,
  mouseForce: 6.5,
  mouseFalloffPower: 2.0,

  // PHYSICS
  returnForce: 0.005,
  damping: 0.94,
} as const;

// =============================================================================
// PERFORMANCE
// =============================================================================

const PERFORMANCE = {
  maxDPR: 2,
  mobileBreakpoint: 768,
  mouseThrottleMs: 16,
} as const;

// =============================================================================
// NOISE
// =============================================================================

function turbulentNoise(x: number, y: number, t: number, offset: number): { nx: number; ny: number } {
  const f1 = 0.007, f2 = 0.011, f3 = 0.004;

  const n1x = Math.sin(x * f1 + t + offset) * Math.cos(y * f1 * 1.3 + t * 0.7);
  const n1y = Math.cos(x * f1 * 0.9 + t * 0.8) * Math.sin(y * f1 + t * 0.6 + offset);

  const n2x = Math.sin(x * f2 - t * 1.1 + offset * 2) * Math.cos(y * f2 * 0.8 + t);
  const n2y = Math.cos(x * f2 + t * 0.85) * Math.sin(y * f2 * 1.1 - t * 0.65 + offset);

  const n3x = Math.sin((x + y) * f3 + t * 0.35) * 0.5;
  const n3y = Math.cos((x - y) * f3 + t * 0.28 + offset) * 0.5;

  const curl = Math.sin(x * 0.005 + y * 0.005 + t * 0.45 + offset);
  const curlX = -Math.sin(y * 0.009 + t) * curl * INTENSITY.turbulenceStrength;
  const curlY = Math.cos(x * 0.009 + t * 0.75) * curl * INTENSITY.turbulenceStrength;

  return {
    nx: (n1x + n2x * 0.45 + n3x + curlX) / 2.3,
    ny: (n1y + n2y * 0.45 + n3y + curlY) / 2.3,
  };
}

// =============================================================================
// CLOUD FACTORY
// =============================================================================

function createCloud(
  width: number,
  height: number,
  layer: DepthLayer,
  index: number,
  totalInLayer: number
): SmokeCloud {
  const layerConfig = INTENSITY.layers[layer];

  const cols = Math.ceil(Math.sqrt(totalInLayer * 1.4));
  const rows = Math.ceil(totalInLayer / cols);
  const col = index % cols;
  const row = Math.floor(index / cols);

  const cellWidth = width / cols;
  const cellHeight = height / rows;

  const baseX = cellWidth * (col + 0.5) + (Math.random() - 0.5) * cellWidth * 1.3;
  const baseY = cellHeight * (row + 0.5) + (Math.random() - 0.5) * cellHeight * 1.3;

  const depthValue = layer === "far" ? 0.15 + Math.random() * 0.2
                   : layer === "mid" ? 0.4 + Math.random() * 0.25
                   : 0.7 + Math.random() * 0.3;

  const radiusRange = layerConfig.maxRadius - layerConfig.minRadius;
  const radius = layerConfig.minRadius + Math.random() * radiusRange;

  // Generate internal wisps with varied brightness
  const wisps: Wisp[] = [];
  for (let i = 0; i < CLARITY.wispCount; i++) {
    const angle = (i / CLARITY.wispCount) * Math.PI * 2 + Math.random() * 0.6;
    wisps.push({
      offsetAngle: angle,
      offsetDist: 0.15 + Math.random() * 0.35,
      scale: 0.25 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      brightness: 0.7 + Math.random() * 0.6, // Varied brightness creates texture
    });
  }

  return {
    x: baseX,
    y: baseY,
    originX: baseX,
    originY: baseY,
    vx: 0,
    vy: 0,
    radius,
    opacity: INTENSITY.baseOpacity * layerConfig.opacity * (0.8 + Math.random() * 0.2),
    phase: Math.random() * Math.PI * 2,
    speed: layerConfig.speed * (0.85 + Math.random() * 0.3),
    depth: depthValue,
    layer,
    turbulenceOffset: Math.random() * 1000,
    wisps,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.0008,
  };
}

// =============================================================================
// RENDER — High-definition smoke with internal structure
// =============================================================================

function drawDefinedGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  sharpness: number,
  depthContrast: number,
  isWisp: boolean = false,
  brightnessMultiplier: number = 1.0
): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  const { colors } = INTENSITY;

  // Apply sharpness to gradient curve
  // Higher sharpness = faster falloff = more defined edges
  const falloffPower = 1 + sharpness * 1.5;

  // Brightness adjusted by depth and multiplier
  const bright = depthContrast * brightnessMultiplier;
  const coreR = Math.min(255, colors.core.r * bright);
  const coreG = Math.min(255, colors.core.g * bright);
  const coreB = Math.min(255, colors.core.b * bright);

  // Core: bright, defined center
  const coreAlpha = alpha * CLARITY.coreContrast;
  gradient.addColorStop(0, `rgba(${coreR}, ${coreG}, ${coreB}, ${coreAlpha})`);

  // Inner ring: slight contrast dip (creates visible structure)
  const ring1Alpha = alpha * CLARITY.ringContrast * 0.9;
  const ring1Pos = 0.12 / falloffPower + 0.08;
  gradient.addColorStop(ring1Pos,
    `rgba(${colors.core.r * bright * 0.92}, ${colors.core.g * bright * 0.92}, ${colors.core.b * bright * 0.95}, ${ring1Alpha})`
  );

  // Mid body: where smoke has visible "mass"
  const midAlpha = alpha * 0.75;
  const midPos = 0.25 / falloffPower + 0.15;
  gradient.addColorStop(midPos,
    `rgba(${colors.mid.r * bright}, ${colors.mid.g * bright}, ${colors.mid.b * bright}, ${midAlpha})`
  );

  // Second ring: more structure
  const ring2Alpha = alpha * CLARITY.ringContrast * 0.6;
  const ring2Pos = 0.4 / falloffPower + 0.2;
  gradient.addColorStop(ring2Pos,
    `rgba(${colors.mid.r * bright * 0.85}, ${colors.mid.g * bright * 0.85}, ${colors.mid.b * bright * 0.88}, ${ring2Alpha})`
  );

  // Outer body
  const outerAlpha = alpha * 0.4;
  const outerPos = 0.55 / falloffPower + 0.25;
  gradient.addColorStop(Math.min(0.85, outerPos),
    `rgba(${colors.edge.r + 30}, ${colors.edge.g + 30}, ${colors.edge.b + 35}, ${outerAlpha})`
  );

  // Edge: controlled by sharpness
  const edgeAlpha = alpha * 0.15 * (1 - sharpness * 0.3);
  const edgePos = 0.75 + sharpness * 0.1;
  gradient.addColorStop(Math.min(0.92, edgePos),
    `rgba(${colors.edge.r}, ${colors.edge.g}, ${colors.edge.b}, ${edgeAlpha})`
  );

  // Fade out
  gradient.addColorStop(0.96, `rgba(${colors.edge.r - 20}, ${colors.edge.g - 20}, ${colors.edge.b - 15}, ${alpha * 0.04})`);
  gradient.addColorStop(1, "transparent");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  cloud: SmokeCloud,
  time: number
): void {
  const { x, y, radius, opacity, phase, layer, wisps, rotation } = cloud;

  // Breathing animation
  const breathing = 1 + Math.sin(time * 0.2 + phase) * INTENSITY.breathingAmount;
  const pulse2 = 1 + Math.sin(time * 0.13 + phase * 1.7) * 0.03;
  const currentRadius = radius * breathing * pulse2;

  // Layer-specific settings
  const sharpness = CLARITY.edgeSharpness[layer];
  const depthContrast = CLARITY.depthContrast[layer];

  // Current rotation for this cloud
  const currentRotation = rotation + time * cloud.rotationSpeed;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(currentRotation);
  ctx.translate(-x, -y);

  // ══════════════════════════════════════════════════════════════════════════
  // PASS 1: Base cloud body
  // ══════════════════════════════════════════════════════════════════════════
  drawDefinedGradient(ctx, x, y, currentRadius, opacity, sharpness, depthContrast);

  // ══════════════════════════════════════════════════════════════════════════
  // PASS 2: Internal wisps (creates visible texture and structure)
  // ══════════════════════════════════════════════════════════════════════════
  if (layer !== "far") {
    const wispAlpha = opacity * CLARITY.wispVisibility * depthContrast;
    const wispSharp = Math.min(1, sharpness * CLARITY.wispSharpness);

    for (const wisp of wisps) {
      // Animate wisp position
      const animAngle = wisp.offsetAngle + Math.sin(time * 0.25 + wisp.phase) * 0.15;
      const animDist = wisp.offsetDist + Math.sin(time * 0.18 + wisp.phase * 1.4) * 0.05;

      const wispX = x + Math.cos(animAngle) * currentRadius * animDist;
      const wispY = y + Math.sin(animAngle) * currentRadius * animDist;
      const wispRadius = currentRadius * wisp.scale;

      // Draw wisp with varied brightness (creates luminance variation)
      drawDefinedGradient(
        ctx, wispX, wispY, wispRadius,
        wispAlpha * wisp.brightness,
        wispSharp,
        depthContrast,
        true,
        wisp.brightness
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PASS 3: Core highlight (adds definition and 3D feel)
  // ══════════════════════════════════════════════════════════════════════════
  if (layer === "near" || layer === "mid") {
    const { highlight } = INTENSITY.colors;
    const hlRadius = currentRadius * 0.22;
    const hlAlpha = opacity * 0.45 * depthContrast;

    // Offset for 3D lighting effect
    const hlOffsetX = Math.sin(time * 0.15 + phase) * currentRadius * 0.06;
    const hlOffsetY = -currentRadius * 0.1 + Math.cos(time * 0.12 + phase) * currentRadius * 0.04;

    const hlGrad = ctx.createRadialGradient(
      x + hlOffsetX, y + hlOffsetY, 0,
      x + hlOffsetX, y + hlOffsetY, hlRadius
    );

    hlGrad.addColorStop(0, `rgba(${highlight.r}, ${highlight.g}, ${highlight.b}, ${hlAlpha})`);
    hlGrad.addColorStop(0.4, `rgba(${highlight.r - 20}, ${highlight.g - 20}, ${highlight.b - 15}, ${hlAlpha * 0.5})`);
    hlGrad.addColorStop(0.7, `rgba(${highlight.r - 50}, ${highlight.g - 50}, ${highlight.b - 40}, ${hlAlpha * 0.15})`);
    hlGrad.addColorStop(1, "transparent");

    ctx.fillStyle = hlGrad;
    ctx.beginPath();
    ctx.arc(x + hlOffsetX, y + hlOffsetY, hlRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function renderFrame(
  ctx: CanvasRenderingContext2D,
  clouds: SmokeCloud[],
  width: number,
  height: number,
  time: number
): void {
  // Very dark background for maximum contrast
  ctx.fillStyle = INTENSITY.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Additive blending for volumetric look
  ctx.globalCompositeOperation = "lighter";

  // Render in depth order
  const layerOrder: DepthLayer[] = ["far", "mid", "near"];

  for (const layer of layerOrder) {
    const layerClouds = clouds
      .filter(c => c.layer === layer)
      .sort((a, b) => a.depth - b.depth);

    for (const cloud of layerClouds) {
      drawCloud(ctx, cloud, time);
    }
  }

  ctx.globalCompositeOperation = "source-over";
}

// =============================================================================
// PHYSICS
// =============================================================================

function updateCloud(
  cloud: SmokeCloud,
  mouse: MouseState,
  time: number,
  width: number,
  height: number
): void {
  const { depth, phase, speed, turbulenceOffset, layer } = cloud;

  const { nx, ny } = turbulentNoise(
    cloud.originX + turbulenceOffset,
    cloud.originY + turbulenceOffset,
    time * speed,
    phase
  );

  const layerAmp = layer === "near" ? 1.15 : layer === "mid" ? 1.0 : 0.75;
  const driftX = nx * INTENSITY.driftAmplitude * depth * layerAmp;
  const driftY = ny * INTENSITY.driftAmplitude * 0.8 * depth * layerAmp;

  const targetX = cloud.originX + driftX;
  const targetY = cloud.originY + driftY;

  cloud.vx += (targetX - cloud.x) * INTENSITY.returnForce;
  cloud.vy += (targetY - cloud.y) * INTENSITY.returnForce;

  // Cursor interaction
  if (mouse.active) {
    const dx = cloud.x - mouse.x;
    const dy = cloud.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < INTENSITY.mouseRadius && dist > 0) {
      const normalizedDist = dist / INTENSITY.mouseRadius;
      const falloff = Math.pow(1 - normalizedDist, INTENSITY.mouseFalloffPower);

      const layerMult = layer === "near" ? 1.25 : layer === "mid" ? 1.0 : 0.65;
      const force = INTENSITY.mouseForce * falloff * layerMult;

      cloud.vx += (dx / dist) * force;
      cloud.vy += (dy / dist) * force;

      // Swirl effect
      const swirl = falloff * 0.2 * layerMult;
      cloud.vx += (-dy / dist) * swirl;
      cloud.vy += (dx / dist) * swirl;
    }
  }

  cloud.vx *= INTENSITY.damping;
  cloud.vy *= INTENSITY.damping;

  cloud.x += cloud.vx;
  cloud.y += cloud.vy;

  const margin = cloud.radius * 0.4;
  cloud.x = Math.max(-margin, Math.min(width + margin, cloud.x));
  cloud.y = Math.max(-margin, Math.min(height + margin, cloud.y));
}

// =============================================================================
// COMPONENT
// =============================================================================

type Props = {
  className?: string;
};

export default function AnimatedSmokeBackground({ className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cloudsRef = useRef<SmokeCloud[]>([]);
  const mouseRef = useRef<MouseState>({ x: 0, y: 0, active: false });
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const isMobileRef = useRef<boolean>(false);
  const lastMouseMoveRef = useRef<number>(0);
  const rectRef = useRef<DOMRect | null>(null);

  const initClouds = useCallback((width: number, height: number) => {
    cloudsRef.current = [];

    const layers: { layer: DepthLayer; count: number }[] = [
      { layer: "far", count: INTENSITY.farLayerCount },
      { layer: "mid", count: INTENSITY.midLayerCount },
      { layer: "near", count: INTENSITY.nearLayerCount },
    ];

    for (const { layer, count } of layers) {
      for (let i = 0; i < count; i++) {
        cloudsRef.current.push(createCloud(width, height, layer, i, count));
      }
    }
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !rectRef.current) return;

    const rect = rectRef.current;
    timeRef.current += INTENSITY.driftSpeed;

    if (!isMobileRef.current) {
      for (const cloud of cloudsRef.current) {
        updateCloud(cloud, mouseRef.current, timeRef.current, rect.width, rect.height);
      }
    }

    renderFrame(ctx, cloudsRef.current, rect.width, rect.height, timeRef.current);
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    isMobileRef.current =
      window.innerWidth < PERFORMANCE.mobileBreakpoint ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      rectRef.current = rect;
      const dpr = Math.min(window.devicePixelRatio || 1, PERFORMANCE.maxDPR);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      initClouds(rect.width, rect.height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMouseMoveRef.current < PERFORMANCE.mouseThrottleMs) return;
      lastMouseMoveRef.current = now;
      const rect = rectRef.current;
      if (!rect) return;
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
    };

    const handleMouseLeave = () => { mouseRef.current.active = false; };

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        isMobileRef.current = window.innerWidth < PERFORMANCE.mobileBreakpoint;
        setupCanvas();
      }, 150);
    };

    setupCanvas();
    window.addEventListener("resize", handleResize);
    if (!isMobileRef.current) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseleave", handleMouseLeave);
    }
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationRef.current);
      clearTimeout(resizeTimeout);
    };
  }, [animate, initClouds]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 0, background: INTENSITY.backgroundColor }}
      aria-hidden="true"
    />
  );
}
