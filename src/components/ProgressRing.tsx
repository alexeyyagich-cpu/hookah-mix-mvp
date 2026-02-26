"use client";

import React, { useId, useEffect, useState, useRef, useCallback } from "react";

type Props = {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color: string;
  label?: string;
  sublabel?: string;
  interactive?: boolean;
  onTargetChange?: (target: number | null) => void;
};

export default function ProgressRing({
  value,
  size = 160,
  strokeWidth = 12,
  color,
  label,
  sublabel,
  interactive = false,
  onTargetChange,
}: Props) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [targetValue, setTargetValue] = useState<number | null>(null);
  const prevValueRef = useRef(0);
  const dragTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Intersection Observer for entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    const element = svgRef.current?.parentElement;
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [isVisible]);

  // Animate value changes (longer duration on first appearance)
  useEffect(() => {
    if (!isVisible) return;

    const isFirstAnimation = prevValueRef.current === 0 && value > 0;
    const duration = isFirstAnimation ? 1200 : 500;
    const startTime = performance.now();
    const startValue = prevValueRef.current;
    const targetVal = Math.min(100, Math.max(0, value));

    let rafId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (targetVal - startValue) * eased;

      setAnimatedValue(currentValue);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = targetVal;
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [value, isVisible]);

  // Calculate angle from mouse/touch position
  const getAngleFromEvent = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return null;

    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Get clientX/Y from mouse or touch event
    let clientX: number, clientY: number;
    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return null;
    }

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Angle in degrees, 0 at top, clockwise
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    return Math.round((angle / 360) * 100);
  }, []);

  // Handle drag start (mouse and touch)
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!interactive) return;
    e.preventDefault();
    setIsDragging(true);
    const angle = getAngleFromEvent(e);
    if (angle !== null) {
      setTargetValue(angle);
      onTargetChange?.(angle);
    }
  }, [interactive, getAngleFromEvent, onTargetChange]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const angle = getAngleFromEvent(e);
      if (angle !== null) {
        setTargetValue(angle);
        onTargetChange?.(angle);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      // Keep target visible briefly, then clear
      dragTimerRef.current = setTimeout(() => {
        setTargetValue(null);
        onTargetChange?.(null);
      }, 2000);
    };

    // Mouse events
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    // Touch events
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      clearTimeout(dragTimerRef.current);
    };
  }, [isDragging, getAngleFromEvent, onTargetChange]);

  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  // Target indicator position
  const targetAngle = targetValue !== null ? ((targetValue / 100) * 360 - 90) * (Math.PI / 180) : 0;
  const targetX = size / 2 + radius * Math.cos(targetAngle);
  const targetY = size / 2 + radius * Math.sin(targetAngle);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`transform -rotate-90 ${interactive ? "cursor-grab active:cursor-grabbing" : ""}`}
        style={{ overflow: "visible", touchAction: "none" }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <defs>
          {/* Gradient for fade at start */}
          <linearGradient
            id={`${id}-fadeGrad`}
            gradientUnits="userSpaceOnUse"
            x1={size / 2}
            y1="0"
            x2={size / 2}
            y2={strokeWidth * 2}
          >
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>

          {/* Glow filter */}
          <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-bgAccent)"
          strokeWidth={strokeWidth}
          opacity="0.3"
        />

        {/* Main progress arc - single clean line */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          filter={`url(#${id}-glow)`}
          style={{
            opacity: isVisible ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        />

        {/* Target indicator (only when actively dragging and target > current) */}
        {interactive && isDragging && targetValue !== null && targetValue > animatedValue && (
          <>
            {/* Target arc (ghost) - dashed line */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth - 4}
              strokeLinecap="round"
              strokeDasharray={`${circumference * 0.02} ${circumference * 0.02}`}
              strokeDashoffset={circumference - (targetValue / 100) * circumference}
              opacity="0.4"
            />
            {/* Target dot with pulse animation */}
            <circle
              cx={targetX}
              cy={targetY}
              r={strokeWidth / 2 + 4}
              fill={color}
              opacity="0.3"
              className="animate-pulse"
            />
            <circle
              cx={targetX}
              cy={targetY}
              r={strokeWidth / 2}
              fill={color}
              opacity="0.8"
            />
          </>
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className="text-4xl font-bold tabular-nums tracking-tight transition-colors duration-300"
          style={{ color }}
        >
          {Math.round(animatedValue)}%
        </span>
        {label && (
          <span
            className="text-xs font-medium mt-1 tracking-wide"
            style={{ color: "var(--color-textMuted)" }}
          >
            {label}
          </span>
        )}
        {sublabel && (
          <span
            className="text-xs font-bold uppercase tracking-widest mt-1"
            style={{ color }}
          >
            {sublabel}
          </span>
        )}

        {/* Target hint when dragging */}
        {interactive && isDragging && targetValue !== null && (
          <div
            className="absolute -bottom-10 text-sm font-semibold px-3 py-1.5 rounded-xl animate-pulse"
            style={{
              background: targetValue > animatedValue ? "var(--color-primary)" : "var(--color-bgHover)",
              color: targetValue > animatedValue ? "var(--color-bg)" : "var(--color-textMuted)",
              boxShadow: targetValue > animatedValue ? "0 4px 16px rgba(var(--color-primary-rgb), 0.3)" : "none",
            }}
          >
            {targetValue > animatedValue ? `→ ${targetValue}%` : `${targetValue}%`}
          </div>
        )}
      </div>

    </div>
  );
}
