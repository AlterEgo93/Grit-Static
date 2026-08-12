import React, { useState } from 'react';
import plankImg from '../assets/images/exercise_plank_1786539063924.jpg';
import pushupsImg from '../assets/images/exercise_pushups_1786539078034.jpg';
import walkingImg from '../assets/images/exercise_walking_1786539090121.jpg';
import wallsitImg from '../assets/images/exercise_wallsit_1786539103392.jpg';
import supermanImg from '../assets/images/exercise_superman_1786539118263.jpg';
import staticPushupImg from '../assets/images/exercise_static_pushup_1786539132615.jpg';
import customImg from '../assets/images/exercise_custom_1786539145050.jpg';

interface Props {
  type?: string;
  className?: string;
  accentColor?: string;
  customUrl?: string;
  altText?: string;
}

const REALISTIC_IMAGE_MAP: Record<string, string> = {
  plank: plankImg,
  pushup: pushupsImg,
  walking: walkingImg,
  wallsit: wallsitImg,
  superman: supermanImg,
  static_pushup: staticPushupImg,
  custom: customImg,
};

export const ExerciseIllustration: React.FC<Props> = ({
  type = 'custom',
  className = 'w-16 h-16',
  accentColor = '#3B82F6',
  customUrl,
  altText = 'Exercise illustration',
}) => {
  const [imageError, setImageError] = useState(false);

  const photoSrc = customUrl || REALISTIC_IMAGE_MAP[type] || customImg;

  if (photoSrc && !imageError) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 group shrink-0 ${className}`}
      >
        <img
          src={photoSrc}
          alt={altText}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-blue-500/20 pointer-events-none" />
      </div>
    );
  }

  // Fallback SVG if image is unavailable
  return (
    <svg viewBox="0 0 100 60" className={className} fill="none" stroke="currentColor">
      <circle cx="50" cy="20" r="6" fill={accentColor} />
      <path d="M 50 26 L 50 45" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
      <path d="M 35 32 L 65 32" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 50 45 L 38 56" stroke="#71717A" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 50 45 L 62 56" stroke="#71717A" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
};
