"use client";

import React from "react";

type Props = {
  color?: string;
  opacity?: number;
  className?: string;
};

export default function TobaccoLeafPattern({
  color = "currentColor",
  opacity = 0.06,
  className = "",
}: Props) {
  return (
    <svg
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ opacity }}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="tobacco-leaves" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          {/* Leaf 1 */}
          <g transform="translate(10, 8) rotate(-15)">
            <path
              d="M0,12 Q4,6 8,0 Q12,6 16,12 Q12,18 8,24 Q4,18 0,12 Z"
              fill="none"
              stroke={color}
              strokeWidth="0.8"
            />
            <path
              d="M8,0 L8,24"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
            />
            <path
              d="M8,6 Q5,8 2,10 M8,12 Q5,14 2,16 M8,6 Q11,8 14,10 M8,12 Q11,14 14,16"
              fill="none"
              stroke={color}
              strokeWidth="0.3"
            />
          </g>

          {/* Leaf 2 */}
          <g transform="translate(38, 28) rotate(20) scale(0.8)">
            <path
              d="M0,12 Q4,6 8,0 Q12,6 16,12 Q12,18 8,24 Q4,18 0,12 Z"
              fill="none"
              stroke={color}
              strokeWidth="0.8"
            />
            <path
              d="M8,0 L8,24"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
            />
            <path
              d="M8,6 Q5,8 2,10 M8,12 Q5,14 2,16 M8,6 Q11,8 14,10 M8,12 Q11,14 14,16"
              fill="none"
              stroke={color}
              strokeWidth="0.3"
            />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tobacco-leaves)" />
    </svg>
  );
}
