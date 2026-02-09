"use client";

import React from "react";

type IconProps = {
  size?: number;
  color?: string;
  className?: string;
};

// Modern, minimal icons inspired by Linear/Vercel/Stripe design systems

export function IconBowl({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 11C4 11 4 7 12 7C20 7 20 11 20 11"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 11C5 15.4183 8.13401 19 12 19C15.866 19 19 15.4183 19 11"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 4V7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="13" r="2" fill={color} opacity="0.3" />
    </svg>
  );
}

export function IconPacking({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect
        x="4"
        y="8"
        width="16"
        height="12"
        rx="2"
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="M8 8V6C8 4.89543 8.89543 4 10 4H14C15.1046 4 16 4.89543 16 6V8"
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="M4 12H20"
        stroke={color}
        strokeWidth="2"
        opacity="0.3"
      />
      <path
        d="M10 12V14H14V12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCoals({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Three coal cubes in perspective */}
      <rect
        x="3"
        y="12"
        width="7"
        height="7"
        rx="1.5"
        stroke={color}
        strokeWidth="2"
      />
      <rect
        x="14"
        y="12"
        width="7"
        height="7"
        rx="1.5"
        stroke={color}
        strokeWidth="2"
      />
      <rect
        x="8.5"
        y="5"
        width="7"
        height="7"
        rx="1.5"
        stroke={color}
        strokeWidth="2"
      />
      {/* Glow dots */}
      <circle cx="6.5" cy="15.5" r="1" fill={color} opacity="0.5" />
      <circle cx="17.5" cy="15.5" r="1" fill={color} opacity="0.5" />
      <circle cx="12" cy="8.5" r="1" fill={color} opacity="0.5" />
    </svg>
  );
}

export function IconTimer({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle
        cx="12"
        cy="13"
        r="8"
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="M12 9V13L15 15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 3H14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 3V5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconStrength({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Gauge/meter style icon */}
      <path
        d="M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z"
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="M12 8V12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 12L16 10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Tick marks */}
      <path d="M12 6V7" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <path d="M6 12H7" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <path d="M18 12H17" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

export function IconHeat({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Flame icon */}
      <path
        d="M12 22C16 22 19 18.5 19 14.5C19 10.5 16 7 14 5C14 8 12 10 10 10C10 10 11 7 9 4C6 7 5 10.5 5 14.5C5 18.5 8 22 12 22Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 22C10 22 8 20 8 17.5C8 15 10 13 12 13C14 15 14 17 14 17.5C14 20 14 22 12 22Z"
        fill={color}
        opacity="0.2"
      />
    </svg>
  );
}

export function IconWarning({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 9V13"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1" fill={color} />
      <path
        d="M10.2679 4.5C11.0377 3.16667 12.9623 3.16667 13.7321 4.5L21.0574 17.25C21.8272 18.5833 20.8649 20.25 19.3253 20.25H4.67468C3.13508 20.25 2.17283 18.5833 2.94263 17.25L10.2679 4.5Z"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}

export function IconSettings({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <path
        d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconTarget({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" opacity="0.5" />
      <circle cx="12" cy="12" r="1.5" fill={color} />
    </svg>
  );
}

export function IconPalette({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C12.5523 21 13 20.5523 13 20V18C13 17.4477 13.4477 17 14 17H16C18.7614 17 21 14.7614 21 12C21 7.02944 16.9706 3 12 3Z"
        stroke={color}
        strokeWidth="2"
      />
      <circle cx="8" cy="10" r="1.5" fill={color} />
      <circle cx="12" cy="8" r="1.5" fill={color} />
      <circle cx="16" cy="10" r="1.5" fill={color} />
      <circle cx="9" cy="14" r="1.5" fill={color} />
    </svg>
  );
}

export function IconLightbulb({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9 21H15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 3C8.13401 3 5 6.13401 5 10C5 12.3869 6.18827 14.4952 8 15.7291V17C8 17.5523 8.44772 18 9 18H15C15.5523 18 16 17.5523 16 17V15.7291C17.8117 14.4952 19 12.3869 19 10C19 6.13401 15.866 3 12 3Z"
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="M12 7V10L14 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />
    </svg>
  );
}

export function IconCheck({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path
        d="M8 12L11 15L16 9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSmoke({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M8 16C8 16 9 14 9 12C9 10 8 8 8 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M12 18C12 18 13 15 13 12C13 9 12 6 12 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 16C16 16 17 14 17 12C17 10 16 8 16 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M4 20H20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
