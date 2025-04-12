'use client';

import { ReactNode } from 'react';
import './Button.css';

export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  isPulse?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  disabled?: boolean;
}

export function Button({ 
  children, 
  onClick, 
  isPulse = false, 
  variant = 'primary', 
  className = '',
  disabled = false
}: ButtonProps) {
  return (
    <button 
      className={`btn ${isPulse ? 'pulse' : ''} ${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
} 