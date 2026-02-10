"use client";

import React, { useEffect, useState } from "react";

type Particle = {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocity: { x: number; y: number };
};

type Props = {
  active: boolean;
  duration?: number;
};

const COLORS = ["#F59E0B", "#EC4899", "#22C55E", "#06B6D4", "#8B5CF6", "#EF4444", "#FACC15"];

export default function Confetti({ active, duration = 3000 }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;

    // Create particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        velocity: {
          x: (Math.random() - 0.5) * 3,
          y: Math.random() * 3 + 2,
        },
      });
    }
    setParticles(newParticles);

    // Clear after duration
    const timer = setTimeout(() => {
      setParticles([]);
    }, duration);

    return () => clearTimeout(timer);
  }, [active, duration]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            transform: `rotate(${p.rotation}deg)`,
            "--fall-duration": `${2 + Math.random() * 2}s`,
            "--drift": `${(Math.random() - 0.5) * 200}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
