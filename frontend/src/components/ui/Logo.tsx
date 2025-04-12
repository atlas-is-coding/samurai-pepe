'use client';

import Image from 'next/image';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`logo-container ${className}`}>
      <Image 
        src="/logo.png" 
        alt="Samurai Pepe Logo" 
        width={100} 
        height={100}
        className="logo" 
      />
    </div>
  );
} 