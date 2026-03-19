'use client';

import { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';

interface AnimatedCounterProps {
  value: number;       // Angka target akhir
  duration?: number;   // Durasi animasi (ms)
  padLength?: number;  // Jumlah digit (misal: 4 untuk 0000)
  className?: string;  
}

export default function AnimatedCounter({ 
  value, 
  duration = 2000, 
  padLength = 4, 
  className = '' 
}: AnimatedCounterProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    // Memastikan animasi berjalan dengan parameter yang konsisten
    if (nodeRef.current && value > 0 && !isAnimated) {
      const animationObj = { currentVal: 0 };
      
      animate(animationObj, {
        currentVal: value,
        duration: duration,
        ease: 'outExpo',
        onUpdate: () => { 
          if (nodeRef.current) {
            // Menggunakan padStart untuk estetika premium
            const paddedValue = String(Math.round(animationObj.currentVal)).padStart(padLength, '0');
            nodeRef.current.innerHTML = paddedValue;
          }
        },
        onComplete: () => { 
          setIsAnimated(true); 
        }
      });
    } else if (nodeRef.current && value === 0) {
       nodeRef.current.innerHTML = String(0).padStart(padLength, '0');
    }
    // Dependency array kini konsisten dengan 4 variabel
  }, [value, duration, padLength, isAnimated]);

  return (
    <span ref={nodeRef} className={className}>
      {String(0).padStart(padLength, '0')}
    </span>
  );
}