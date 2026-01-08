// apps/frontend/src/components/AnimatedCounter.tsx
// Smooth animated counter using react-countup
// Triggers on scroll into view with counting animation

import React from 'react';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

interface AnimatedCounterProps {
  value: string; // Display value (can include text like "$14 Billion")
  label: string; // Label text below the number
  duration?: number; // Animation duration in seconds
  className?: string;
  style?: React.CSSProperties;
  prefix?: string; // Prefix text (e.g., "$")
  suffix?: string; // Suffix text (e.g., "Billion")
  separator?: string; // Thousands separator (e.g., ",")
  decimals?: number; // Number of decimal places
  enableScrollSpy?: boolean; // Enable scroll spy for re-animation
}

export function AnimatedCounter({
  value,
  label,
  duration = 2.5,
  className = '',
  style = {},
  prefix = '',
  suffix = '',
  separator = ',',
  decimals = 0,
  enableScrollSpy = true
}: AnimatedCounterProps) {
  const { ref, inView } = useInView({
    triggerOnce: true, // Only animate once
    threshold: 0.3, // Trigger when 30% visible
  });

  // Parse value and determine animation strategy
  const parseValue = (val: string) => {
    // Handle range percentages like "8-12%"
    if (val.includes('-') && val.includes('%')) {
      const parts = val.split('-');
      const firstNum = parseFloat(parts[0].replace(/[^0-9.]/g, '')) || 0;
      const secondNum = parseFloat(parts[1].replace(/[^0-9.]/g, '')) || 0;
      return { 
        num: firstNum,
        prefix: '',
        suffix: `-${secondNum}%`,
        decimals: 0,
        isRange: true
      };
    }
    
    // Handle currency values like "$14 Billion" or "$3 Trillion"
    if (val.includes('Billion')) {
      const numMatch = val.match(/(\d+(?:\.\d+)?)/);
      const num = numMatch ? parseFloat(numMatch[1]) : 0;
      return { 
        num,
        prefix: '$',
        suffix: ' Billion',
        decimals: 0,
        isRange: false
      };
    }
    if (val.includes('Trillion')) {
      const numMatch = val.match(/(\d+(?:\.\d+)?)/);
      const num = numMatch ? parseFloat(numMatch[1]) : 0;
      return { 
        num,
        prefix: '$',
        suffix: ' Trillion',
        decimals: 0,
        isRange: false
      };
    }
    
    // Default: extract number
    const numMatch = val.match(/(\d+(?:\.\d+)?)/);
    return { 
      num: numMatch ? parseFloat(numMatch[1]) : 0,
      prefix: prefix || '',
      suffix: suffix || '',
      decimals,
      isRange: false
    };
  };

  const { num, prefix: finalPrefix, suffix: finalSuffix, decimals: finalDecimals, isRange } = parseValue(value);

  return (
    <div ref={ref} className={className} style={style}>
      {/* Animated Number */}
      <div 
        className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-bold text-white leading-none mb-4"
        style={{ 
          fontFamily: 'sans-serif',
          letterSpacing: '-0.02em',
          lineHeight: 1
        }}
      >
        {inView ? (
          <CountUp
            start={0}
            end={num}
            duration={duration}
            separator={separator}
            decimals={finalDecimals}
            prefix={finalPrefix}
            suffix={finalSuffix}
            enableScrollSpy={enableScrollSpy}
            scrollSpyOnce={true}
          />
        ) : (
          <span style={{ opacity: 0 }}>{value}</span>
        )}
      </div>
      
      {/* Label */}
      <p 
        className="text-gray-500 text-xs md:text-sm uppercase font-medium max-w-xs"
        style={{ 
          letterSpacing: '0.15em',
          fontFamily: 'sans-serif',
          lineHeight: 1.5
        }}
      >
        {label}
      </p>
    </div>
  );
}
