// apps/frontend/src/components/SlotCounter.tsx
// Animated Slot Machine Counter Component
// Animates numbers with a slot machine effect: fast cycling → deceleration → lock

import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

interface SlotCounterProps {
  value: string; // e.g., "3,214+" or "3,685" or "5"
  className?: string;
  style?: React.CSSProperties;
  duration?: number; // Total animation duration in ms (default: 1500)
  phase1Duration?: number; // Fast cycling phase (default: 600ms)
  phase2Duration?: number; // Deceleration phase (default: 400ms)
  phase3Duration?: number; // Lock phase (default: 500ms)
}

interface DigitState {
  char: string; // The actual character (digit or non-digit)
  isDigit: boolean; // Whether this character should animate
  currentValue: number; // Current displayed digit (0-9)
  targetValue: number; // Target digit to lock on
  isLocked: boolean; // Whether this digit has locked to target
}

export function SlotCounter({ 
  value, 
  className = '', 
  style = {},
  duration = 1500,
  phase1Duration = 600,
  phase2Duration = 400,
  phase3Duration = 500
}: SlotCounterProps) {
  const [ref, inView] = useInView({
    triggerOnce: true, // Only animate once when scrolled into view
    threshold: 0.3, // Trigger when 30% of element is visible
  });

  const [digits, setDigits] = useState<DigitState[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false); // Track if animation has completed
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Parse the value string into digit states
  useEffect(() => {
    const parsed: DigitState[] = [];
    for (let i = 0; i < value.length; i++) {
      const char = value[i];
      const isDigit = /[0-9]/.test(char);
      parsed.push({
        char,
        isDigit,
        currentValue: isDigit ? parseInt(char, 10) : 0,
        targetValue: isDigit ? parseInt(char, 10) : 0,
        isLocked: false,
      });
    }
    setDigits(parsed);
  }, [value]);

  // Animation logic
  useEffect(() => {
    if (!inView || digits.length === 0 || isAnimating || hasAnimated) return;

    // Find all digit indices
    const digitIndices = digits
      .map((d, i) => (d.isDigit ? i : -1))
      .filter(i => i !== -1);

    if (digitIndices.length === 0) return;

    setIsAnimating(true);
    startTimeRef.current = Date.now();

    // Phase 1: Fast random cycling (0.5-1s)
    const phase1End = phase1Duration;
    // Phase 2: Deceleration (gradual slowdown)
    const phase2End = phase1Duration + phase2Duration;
    // Phase 3: Lock to target (one by one or together)
    const phase3End = duration;

    const lastDigitUpdate = new Map<number, number>(); // Track last update time per digit index

    const animate = () => {
      const elapsed = Date.now() - (startTimeRef.current || 0);
      const now = Date.now();

      if (elapsed >= duration) {
        // Animation complete - lock all digits to target
        setDigits(prev => prev.map(d => ({
          ...d,
          currentValue: d.targetValue,
          isLocked: true,
        })));
        setIsAnimating(false);
        setHasAnimated(true);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        return;
      }

      setDigits(prev => prev.map((d, index) => {
        if (!d.isDigit || d.isLocked) return d; // Non-digits and locked digits stay static

        let shouldUpdate = false;
        let cycleSpeed = 50; // Default fast speed

        if (elapsed < phase1End) {
          // Phase 1: Fast random cycling (every 30-50ms)
          cycleSpeed = 40;
          const lastUpdate = lastDigitUpdate.get(index) || startTimeRef.current || 0;
          shouldUpdate = (now - lastUpdate) >= cycleSpeed;
          
          if (shouldUpdate) {
            lastDigitUpdate.set(index, now);
            return {
              ...d,
              currentValue: Math.floor(Math.random() * 10),
              isLocked: false,
            };
          }
        } else if (elapsed < phase2End) {
          // Phase 2: Deceleration (slowing down)
          const progress = (elapsed - phase1End) / phase2Duration;
          cycleSpeed = 50 + (progress * 300); // Slowing from 50ms to 350ms
          const lastUpdate = lastDigitUpdate.get(index) || startTimeRef.current || 0;
          shouldUpdate = (now - lastUpdate) >= cycleSpeed;
          
          if (shouldUpdate) {
            lastDigitUpdate.set(index, now);
            const distance = d.targetValue - d.currentValue;
            // Gradually move towards target (80% chance at end of phase 2)
            if (Math.abs(distance) > 0 && Math.random() < 0.2 + progress * 0.6) {
              // Move towards target (wrap around if needed)
              const step = distance > 5 ? -1 : distance < -5 ? 1 : (distance > 0 ? 1 : -1);
              let newValue = d.currentValue + step;
              if (newValue < 0) newValue = 9;
              if (newValue > 9) newValue = 0;
              return { ...d, currentValue: newValue, isLocked: false };
            } else {
              return { ...d, currentValue: Math.floor(Math.random() * 10), isLocked: false };
            }
          }
        } else {
          // Phase 3: Lock to target (one by one from left to right)
          const phase3Progress = (elapsed - phase2End) / phase3Duration;
          const digitIndex = digitIndices.indexOf(index);
          const totalDigits = digitIndices.length;
          // Lock from left to right (staggered)
          const lockThreshold = (digitIndex + 1) / (totalDigits + 1);
          
          if (phase3Progress >= lockThreshold) {
            // Lock this digit
            return {
              ...d,
              currentValue: d.targetValue,
              isLocked: true,
            };
          } else {
            // Still cycling but very slow
            cycleSpeed = 250 + (phase3Progress * 500);
            const lastUpdate = lastDigitUpdate.get(index) || startTimeRef.current || 0;
            shouldUpdate = (now - lastUpdate) >= cycleSpeed;
            
            if (shouldUpdate) {
              lastDigitUpdate.set(index, now);
              // Very close to target - mostly show target, sometimes random
              if (Math.random() < 0.7 + phase3Progress * 0.25) {
                return { ...d, currentValue: d.targetValue, isLocked: false };
              } else {
                return { ...d, currentValue: Math.floor(Math.random() * 10), isLocked: false };
              }
            }
          }
        }
        
        return d;
      }));

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [inView, digits.length, isAnimating, hasAnimated, duration, phase1Duration, phase2Duration, phase3Duration]);

  // If already animated and in view, show final value
  useEffect(() => {
    if (hasAnimated && digits.length > 0) {
      setDigits(prev => prev.map(d => ({
        ...d,
        currentValue: d.targetValue,
        isLocked: true,
      })));
    }
  }, [hasAnimated, digits.length]);

  // Render the counter
  return (
    <span ref={ref} className={className} style={style}>
      {digits.map((digit, index) => (
        <span key={index}>
          {digit.isDigit ? digit.currentValue.toString() : digit.char}
        </span>
      ))}
    </span>
  );
}
