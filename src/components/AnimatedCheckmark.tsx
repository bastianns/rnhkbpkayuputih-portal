'use client';

import { useEffect, useRef } from 'react';
import { animate } from 'animejs';

interface AnimatedCheckmarkProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function AnimatedCheckmark({ 
  size = 48, 
  color = '#10b981', // Default hijau (Emerald Tailwind)
  className = '' 
}: AnimatedCheckmarkProps) {
  
  const circleRef = useRef<SVGCircleElement>(null);
  const checkRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    // 1. Animasi Gambar Lingkaran Luar
    if (circleRef.current) {
      // Menghitung panjang garis lingkaran secara native
      const circleLength = circleRef.current.getTotalLength();
      circleRef.current.style.strokeDasharray = circleLength.toString();

      animate(circleRef.current, {
        strokeDashoffset: [circleLength, 0], // Dari tak terlihat (sepanjang garis) menjadi 0 (penuh)
        ease: 'inOutSine',
        duration: 600,
      });
    }

    // 2. Animasi Gambar Tanda Centang
    if (checkRef.current) {
      // Menghitung panjang garis centang secara native
      const checkLength = checkRef.current.getTotalLength();
      checkRef.current.style.strokeDasharray = checkLength.toString();

      animate(checkRef.current, {
        strokeDashoffset: [checkLength, 0],
        ease: 'outExpo',
        duration: 400,
        delay: 300 // Jeda 300ms, menunggu lingkaran hampir selesai digambar
      });
    }
  }, []);

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Lingkaran */}
      <circle 
        ref={circleRef}
        cx="12" 
        cy="12" 
        r="10" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* Tanda Centang */}
      <path 
        ref={checkRef}
        d="M8 12L11 15L16 9" 
        stroke={color} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}