import React from 'react';

export const SketchArrow = ({ className = "" }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 60" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M5 35C25 20 45 15 75 25" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round"
      className="animate-stroke"
      style={{ strokeDasharray: 200, strokeDashoffset: 200, animation: 'stroke 1.5s ease-out forwards' }}
    />
    <path 
      d="M65 15L77 26L62 32" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="animate-stroke"
      style={{ strokeDasharray: 100, strokeDashoffset: 100, animation: 'stroke 1s ease-out 0.8s forwards' }}
    />
  </svg>
);

export const SketchStar = ({ className = "" }: { className?: string }) => (
  <svg 
    viewBox="0 0 40 40" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M20 5L23 15L33 15L25 22L28 33L20 26L12 33L15 22L7 15L17 15Z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
  </svg>
);

export const SketchCircle = ({ className = "" }: { className?: string }) => (
  <svg 
    viewBox="0 0 60 60" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse 
      cx="30" 
      cy="30" 
      rx="25" 
      ry="24" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
      transform="rotate(5 30 30)"
      style={{ strokeDasharray: 200, strokeDashoffset: 200, animation: 'stroke 2s ease-out forwards' }}
    />
  </svg>
);

export const SketchUnderline = ({ className = "" }: { className?: string }) => (
  <svg 
    viewBox="0 0 200 20" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M5 12C40 8 80 14 120 10C160 6 195 11 195 11" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round"
      style={{ strokeDasharray: 300, strokeDashoffset: 300, animation: 'stroke 1s ease-out 0.3s forwards' }}
    />
  </svg>
);

export const SketchBox = ({ className = "" }: { className?: string }) => (
  <svg 
    viewBox="0 0 120 80" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect 
      x="5" 
      y="5" 
      width="110" 
      height="70" 
      rx="4"
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
      fill="currentColor"
      fillOpacity="0.05"
      transform="rotate(0.5 60 40)"
    />
  </svg>
);

export const SketchLightning = ({ className = "" }: { className?: string }) => (
  <svg 
    viewBox="0 0 40 50" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M22 5L8 25H18L15 45L32 22H22L25 5H22Z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.15"
    />
  </svg>
);

export const SketchCloud = ({ className = "" }: { className?: string }) => (
  <svg 
    viewBox="0 0 60 40" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M15 30C8 30 5 25 5 20C5 14 10 10 16 11C17 6 22 3 28 3C35 3 40 8 41 14C48 14 53 19 53 25C53 31 48 35 42 35H15C12 35 9 33 9 30" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
      fill="currentColor"
      fillOpacity="0.08"
    />
  </svg>
);

export const SketchDatabase = ({ className = "" }: { className?: string }) => (
  <svg 
    viewBox="0 0 40 50" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="20" cy="10" rx="15" ry="6" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
    <path d="M5 10V40C5 44 12 48 20 48C28 48 35 44 35 40V10" stroke="currentColor" strokeWidth="2" />
    <path d="M5 22C5 26 12 30 20 30C28 30 35 26 35 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M5 34C5 38 12 42 20 42C28 42 35 38 35 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
  </svg>
);

export const CursorPointer = ({ color, name, className = "" }: { color: string; name: string; className?: string }) => (
  <div className={`flex items-start gap-1 ${className}`}>
    <svg 
      width="20" 
      height="24" 
      viewBox="0 0 20 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M3 2L17 12L10 13L7 21L3 2Z" 
        fill={color} 
        stroke={color}
        strokeWidth="2" 
        strokeLinejoin="round"
      />
    </svg>
    <span 
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: color, color: 'white' }}
    >
      {name}
    </span>
  </div>
);

export const SketchSparkle = ({ className = "" }: { className?: string }) => (
  <svg 
    viewBox="0 0 30 30" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M15 3L17 12L26 15L17 18L15 27L13 18L4 15L13 12L15 3Z" 
      fill="currentColor"
      fillOpacity="0.2"
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);