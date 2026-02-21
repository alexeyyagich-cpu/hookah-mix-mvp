"use client";


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

export function IconUsers({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="7" r="3" stroke={color} strokeWidth="2" />
      <path
        d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="17" cy="7" r="2.5" stroke={color} strokeWidth="2" opacity="0.6" />
      <path
        d="M21 21v-1.5a3 3 0 00-3-3h-1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
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

// Dashboard & Navigation Icons

export function IconDashboard({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="8" height="8" rx="2" stroke={color} strokeWidth="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" stroke={color} strokeWidth="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" stroke={color} strokeWidth="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function IconInventory({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M20 7L12 3L4 7V17L12 21L20 17V7Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 12L20 7" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M12 12L4 7" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M12 12V21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconCalendar({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <path d="M3 10H21" stroke={color} strokeWidth="2" />
      <path d="M8 2V6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 2V6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="15" r="1" fill={color} />
      <circle cx="12" cy="15" r="1" fill={color} />
      <circle cx="16" cy="15" r="1" fill={color} />
    </svg>
  );
}

export function IconChart({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 3V21H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 16V12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M11 16V8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M15 16V11" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M19 16V6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconStar({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2L14.9 8.6L22 9.3L17 14.1L18.2 21L12 17.5L5.8 21L7 14.1L2 9.3L9.1 8.6L12 2Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPercent({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="2" />
      <circle cx="16" cy="16" r="3" stroke={color} strokeWidth="2" />
      <path d="M19 5L5 19" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconScale({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3V7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M3 7H21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M6 7L4 15H10L8 7" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M18 7L16 15H22L20 7" stroke={color} strokeWidth="2" strokeLinejoin="round" opacity="0.5" />
      <path d="M12 7V21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M8 21H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconCalculator({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="2" />
      <rect x="7" y="5" width="10" height="4" rx="1" stroke={color} strokeWidth="1.5" />
      <circle cx="8" cy="13" r="1" fill={color} />
      <circle cx="12" cy="13" r="1" fill={color} />
      <circle cx="16" cy="13" r="1" fill={color} />
      <circle cx="8" cy="17" r="1" fill={color} />
      <circle cx="12" cy="17" r="1" fill={color} />
      <circle cx="16" cy="17" r="1" fill={color} />
    </svg>
  );
}

export function IconLogout({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H9" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 17L21 12L16 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12H9" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconTrendUp({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M22 7L13.5 15.5L8.5 10.5L2 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 7H22V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSession({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M12 7V12L15 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMix({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M12 3V12L19 16" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M12 12L5 16" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
  );
}

export function IconArrowRight({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconFire({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 22C16.4183 22 20 18.4183 20 14C20 9 15 5 12 2C9 5 4 9 4 14C4 18.4183 7.58172 22 12 22Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 22C14.2091 22 16 19.9853 16 17.5C16 14.5 13.5 12 12 10C10.5 12 8 14.5 8 17.5C8 19.9853 9.79086 22 12 22Z"
        fill={color}
        opacity="0.3"
      />
    </svg>
  );
}

export function IconCoin({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M12 7V17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M15 9.5C15 8.5 13.6569 8 12 8C10.3431 8 9 8.5 9 9.5C9 10.5 10.3431 11 12 11C13.6569 11 15 11.5 15 12.5C15 13.5 13.6569 14 12 14C10.3431 14 9 14.5 9 15.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconLock({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2" />
      <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill={color} />
    </svg>
  );
}

export function IconExport({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3V15M12 3L7 8M12 3L17 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlus({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5V19M5 12H19" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconHeart({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 21C12 21 4 14.5 4 9C4 6.23858 6.23858 4 9 4C10.6569 4 12 5 12 5C12 5 13.3431 4 15 4C17.7614 4 20 6.23858 20 9C20 14.5 12 21 12 21Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconHeartFilled({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 21C12 21 4 14.5 4 9C4 6.23858 6.23858 4 9 4C10.6569 4 12 5 12 5C12 5 13.3431 4 15 4C17.7614 4 20 6.23858 20 9C20 14.5 12 21 12 21Z"
        fill={color}
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}

export function IconTrash({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 7H20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M10 11V17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11V17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M5 7L6 19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19L19 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 7V4C9 3.44772 9.44772 3 10 3H14C14.5523 3 15 3.44772 15 4V7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconClose({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSearch({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <path d="M16 16L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconEdit({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 20V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Marketplace Icons

export function IconShop({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 9L4.5 4H19.5L21 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 9V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 9H21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="7.5" cy="9" r="2.5" stroke={color} strokeWidth="2" opacity="0.5" />
      <circle cx="16.5" cy="9" r="2.5" stroke={color} strokeWidth="2" opacity="0.5" />
      <path d="M9 21V15C9 14.4477 9.44772 14 10 14H14C14.5523 14 15 14.4477 15 15V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconFloor({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Floor plan layout icon */}
      <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <circle cx="8" cy="8" r="2.5" stroke={color} strokeWidth="1.5" opacity="0.7" />
      <rect x="13" y="5" width="5" height="3" rx="1" stroke={color} strokeWidth="1.5" opacity="0.7" />
      <rect x="5" y="14" width="6" height="4" rx="1" stroke={color} strokeWidth="1.5" opacity="0.7" />
      <circle cx="16" cy="15" r="2" stroke={color} strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}

export function IconCart({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 6H21L19 15H8L6 6Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 6L5 3H2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 15L7 18H19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="21" r="1.5" fill={color} />
      <circle cx="17" cy="21" r="1.5" fill={color} />
    </svg>
  );
}

export function IconTruck({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="1" y="6" width="14" height="10" rx="1" stroke={color} strokeWidth="2" />
      <path d="M15 10H19L22 13V15H15V10Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="17" r="2" stroke={color} strokeWidth="2" />
      <circle cx="18" cy="17" r="2" stroke={color} strokeWidth="2" />
      <path d="M8 17H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconPackage({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3L21 7.5V16.5L12 21L3 16.5V7.5L12 3Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 12L21 7.5" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M12 12L3 7.5" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M12 12V21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M7.5 5.25L16.5 9.75" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

export function IconRefresh({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C15.3137 3 18.1991 4.7686 19.7279 7.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M21 3V8H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMinus({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 12H19" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconChevronRight({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 6L15 12L9 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronLeft({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M15 6L9 12L15 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMail({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="2" />
      <path d="M3 7L12 13L21 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconScan({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Corner brackets */}
      <path d="M4 8V6C4 4.89543 4.89543 4 6 4H8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 4H18C19.1046 4 20 4.89543 20 6V8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M20 16V18C20 19.1046 19.1046 20 18 20H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M8 20H6C4.89543 20 4 19.1046 4 18V16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Scan line */}
      <line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconBarcode({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4" width="2" height="16" fill={color} />
      <rect x="7" y="4" width="1" height="16" fill={color} />
      <rect x="10" y="4" width="2" height="16" fill={color} />
      <rect x="14" y="4" width="1" height="16" fill={color} />
      <rect x="17" y="4" width="3" height="16" fill={color} />
      <rect x="21" y="4" width="1" height="16" fill={color} />
    </svg>
  );
}

// Bar module icons

export function IconBar({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M8 2L1 12H15L8 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 12V20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M4 20H12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="8" r="4" stroke={color} strokeWidth="2" />
      <path d="M18 12V20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconCocktail({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M8 2H20L14 10V18H16V20H8V18H10V10L4 2H8Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 6H17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconMenuList({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 6H20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M4 10H14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M4 14H20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M4 18H14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="10" r="2" fill={color} opacity="0.4" />
      <circle cx="18" cy="18" r="2" fill={color} opacity="0.4" />
    </svg>
  );
}

export function IconCrown({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 17l3-8 4 4 3-6 3 6 4-4 3 8H2z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M3 20h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconModule({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" opacity="0.4" />
    </svg>
  );
}
