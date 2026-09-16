/**
 * PlayerFaceCard Component
 * Renders an authentic EA FC-style Ultimate Team Face Card with dynamic SVG avatar likeness,
 * customizable card tiers (Gold Rare, TOTS, TOTW, Future Stars, Icon), player ratings, and attributes.
 */

import React from 'react';
import { Player, Team, HairStyle, FacialHair, FaceCardTheme } from '../types/soccer';
import { ClubEmblem } from './ClubEmblem';
import { Sparkles } from 'lucide-react';

interface PlayerFaceCardProps {
  player: Player;
  team?: Team;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  showDetails?: boolean;
}

// Visual theme configurations for different card editions
const CARD_THEMES: Record<
  FaceCardTheme,
  {
    bg: string;
    border: string;
    ratingColor: string;
    labelColor: string;
    statsColor: string;
    bannerBg: string;
    accentGlow: string;
  }
> = {
  gold: {
    bg: 'bg-gradient-to-b from-[#fce988] via-[#eab308] to-[#92400e]',
    border: 'border-[#fef08a] shadow-[0_0_25px_rgba(234,179,8,0.4)]',
    ratingColor: 'text-amber-950',
    labelColor: 'text-amber-900',
    statsColor: 'text-amber-950',
    bannerBg: 'bg-amber-950/20 border-amber-950/30 text-amber-950',
    accentGlow: 'from-amber-300/40 via-yellow-400/20 to-transparent',
  },
  tots: {
    bg: 'bg-gradient-to-b from-[#0284c7] via-[#1e40af] to-[#0f172a]',
    border: 'border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.5)]',
    ratingColor: 'text-cyan-300',
    labelColor: 'text-cyan-200',
    statsColor: 'text-white',
    bannerBg: 'bg-cyan-950/80 border-cyan-400/40 text-cyan-300',
    accentGlow: 'from-cyan-400/40 via-blue-500/20 to-transparent',
  },
  totw: {
    bg: 'bg-gradient-to-b from-[#18181b] via-[#09090b] to-[#000000]',
    border: 'border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.3)]',
    ratingColor: 'text-amber-400',
    labelColor: 'text-amber-300/80',
    statsColor: 'text-amber-100',
    bannerBg: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
    accentGlow: 'from-amber-400/20 via-yellow-500/10 to-transparent',
  },
  future_stars: {
    bg: 'bg-gradient-to-b from-[#c026d3] via-[#7e22ce] to-[#0f172a]',
    border: 'border-pink-400 shadow-[0_0_25px_rgba(244,114,182,0.45)]',
    ratingColor: 'text-pink-200',
    labelColor: 'text-pink-300',
    statsColor: 'text-white',
    bannerBg: 'bg-pink-950/60 border-pink-400/40 text-pink-200',
    accentGlow: 'from-pink-500/40 via-purple-500/20 to-transparent',
  },
  icon: {
    bg: 'bg-gradient-to-b from-[#fefce8] via-[#f5f5f4] to-[#d6d3d1]',
    border: 'border-amber-300 shadow-[0_0_25px_rgba(217,119,6,0.3)]',
    ratingColor: 'text-stone-900',
    labelColor: 'text-stone-700',
    statsColor: 'text-stone-950',
    bannerBg: 'bg-amber-900/15 border-amber-800/30 text-stone-900',
    accentGlow: 'from-amber-200/50 via-stone-200/30 to-transparent',
  },
};

/**
 * Realistic Procedural Vector Portrait Generator
 * Generates authentic human facial likeness with anatomical contours,
 * directional lighting, realistic eyes with reflections, sculpted noses,
 * natural lips, and layered hairstyles.
 */
export const PlayerFaceAvatar: React.FC<{
  skinTone: string;
  hairStyle: HairStyle;
  hairColor: string;
  facialHair?: FacialHair;
  jerseyColor?: string;
  size?: number;
}> = ({
  skinTone = '#d49b6a',
  hairStyle = 'short',
  hairColor = '#1f2937',
  facialHair = 'none',
  jerseyColor = '#0284c7',
  size = 120,
}) => {
  // Generate unique ID suffix to avoid gradient collision if multiple avatars render
  const idSuffix = React.useId().replace(/[:]/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-xl"
    >
      <defs>
        {/* 3D Facial Lighting: Forehead & Cheekbone Specular to Jaw Shading */}
        <radialGradient id={`faceLight_${idSuffix}`} cx="48%" cy="40%" r="52%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
        </radialGradient>

        {/* Neck Ambient Occlusion under Chin */}
        <linearGradient id={`neckShadow_${idSuffix}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
        </linearGradient>

        {/* Realistic Hair Directional Sheen */}
        <linearGradient id={`hairShine_${idSuffix}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
        </linearGradient>

        {/* Iris Radial Depth */}
        <radialGradient id={`irisGlow_${idSuffix}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="65%" stopColor="#451a03" />
          <stop offset="100%" stopColor="#1c1917" />
        </radialGradient>

        {/* Jersey Fabric Shading */}
        <linearGradient id={`jerseyShade_${idSuffix}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="60%" stopColor="#000000" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* -------------------------------------------------------------
          1. ATHLETIC JERSEY & COLLAR
      ------------------------------------------------------------- */}
      {/* Jersey Shoulders & Chest Trapezius */}
      <path
        d="M 12 96 C 16 75, 32 67, 50 67 C 68 67, 84 75, 88 96 Z"
        fill={jerseyColor}
      />
      <path
        d="M 12 96 C 16 75, 32 67, 50 67 C 68 67, 84 75, 88 96 Z"
        fill={`url(#jerseyShade_${idSuffix})`}
      />

      {/* Shoulder Seam Stitching */}
      <path d="M 28 72 L 18 96" stroke="#ffffff" strokeWidth="0.75" strokeOpacity="0.4" />
      <path d="M 72 72 L 82 96" stroke="#ffffff" strokeWidth="0.75" strokeOpacity="0.4" />

      {/* Collar & V-Neck Opening */}
      <polygon points="38,67 62,67 50,83" fill={skinTone} />
      <polygon points="38,67 62,67 50,83" fill={`url(#neckShadow_${idSuffix})`} />
      <path
        d="M 37 67 L 50 83 L 63 67"
        stroke="#ffffff"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-sm"
      />

      {/* -------------------------------------------------------------
          2. ANATOMICAL NECK & THROAT
      ------------------------------------------------------------- */}
      <rect x="41" y="49" width="18" height="22" fill={skinTone} rx="3" />
      {/* Sternocleidomastoid Muscle Shadows */}
      <path d="M 43 51 L 47 70" stroke="#000000" strokeWidth="1.2" strokeOpacity="0.22" strokeLinecap="round" />
      <path d="M 57 51 L 53 70" stroke="#000000" strokeWidth="1.2" strokeOpacity="0.22" strokeLinecap="round" />
      {/* Jawline Ambient Shadow over Neck */}
      <path d="M 32 50 Q 50 62 68 50 L 68 58 Q 50 68 32 58 Z" fill={`url(#neckShadow_${idSuffix})`} />

      {/* -------------------------------------------------------------
          3. EARS WITH ANATOMICAL CARTILAGE
      ------------------------------------------------------------- */}
      {/* Left Ear */}
      <ellipse cx="27.5" cy="44" rx="4.5" ry="7" fill={skinTone} />
      <path d="M 28 40 Q 25 44 28 47" stroke="#000000" strokeWidth="1.2" strokeOpacity="0.3" fill="none" strokeLinecap="round" />
      {/* Right Ear */}
      <ellipse cx="72.5" cy="44" rx="4.5" ry="7" fill={skinTone} />
      <path d="M 72 40 Q 75 44 72 47" stroke="#000000" strokeWidth="1.2" strokeOpacity="0.3" fill="none" strokeLinecap="round" />

      {/* -------------------------------------------------------------
          4. HEAD & SCULPTED JAWLINE
      ------------------------------------------------------------- */}
      {/* Contoured Cranium and Jaw */}
      <path
        d="M 29 35 C 29 18, 71 18, 71 35 C 71 47, 65 57, 56 60.5 C 52 62, 48 62, 44 60.5 C 35 57, 29 47, 29 35 Z"
        fill={skinTone}
      />
      {/* 3D Directional Light Shading */}
      <path
        d="M 29 35 C 29 18, 71 18, 71 35 C 71 47, 65 57, 56 60.5 C 52 62, 48 62, 44 60.5 C 35 57, 29 47, 29 35 Z"
        fill={`url(#faceLight_${idSuffix})`}
      />

      {/* Cheekbone & Temple Highlights */}
      <ellipse cx="36" cy="41" rx="4" ry="2.5" fill="#ffffff" fillOpacity="0.12" />
      <ellipse cx="64" cy="41" rx="4" ry="2.5" fill="#ffffff" fillOpacity="0.12" />

      {/* -------------------------------------------------------------
          5. REALISTIC EYES & DETAILED IRISES
      ------------------------------------------------------------- */}
      {/* Left Eye Socket & Sclera */}
      <g>
        {/* Upper eyelid crease */}
        <path d="M 36 34 Q 41.5 31.5 47 34" stroke="#000000" strokeWidth="0.8" strokeOpacity="0.35" fill="none" />
        {/* Sclera Eyeball */}
        <path d="M 37 37 Q 42 34 47 37 Q 42 41 37 37 Z" fill="#f8fafc" />
        {/* Upper Eye Shadow inside eyeball */}
        <path d="M 37 37 Q 42 34 47 37 Q 42 36 37 37 Z" fill="#000000" fillOpacity="0.25" />
        {/* Iris */}
        <circle cx="42" cy="37" r="2.4" fill={`url(#irisGlow_${idSuffix})`} />
        {/* Pupil */}
        <circle cx="42" cy="37" r="1.1" fill="#09090b" />
        {/* Specular Catchlight Reflection */}
        <circle cx="42.6" cy="36.4" r="0.6" fill="#ffffff" />
        {/* Upper lash line */}
        <path d="M 36.5 37 Q 42 33.8 47.5 37" stroke="#18181b" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </g>

      {/* Right Eye Socket & Sclera */}
      <g>
        {/* Upper eyelid crease */}
        <path d="M 53 34 Q 58.5 31.5 64 34" stroke="#000000" strokeWidth="0.8" strokeOpacity="0.35" fill="none" />
        {/* Sclera Eyeball */}
        <path d="M 53 37 Q 58 34 63 37 Q 58 41 53 37 Z" fill="#f8fafc" />
        {/* Upper Eye Shadow inside eyeball */}
        <path d="M 53 37 Q 58 34 63 37 Q 58 36 53 37 Z" fill="#000000" fillOpacity="0.25" />
        {/* Iris */}
        <circle cx="58" cy="37" r="2.4" fill={`url(#irisGlow_${idSuffix})`} />
        {/* Pupil */}
        <circle cx="58" cy="37" r="1.1" fill="#09090b" />
        {/* Specular Catchlight Reflection */}
        <circle cx="58.6" cy="36.4" r="0.6" fill="#ffffff" />
        {/* Upper lash line */}
        <path d="M 52.5 37 Q 58 33.8 63.5 37" stroke="#18181b" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </g>

      {/* -------------------------------------------------------------
          6. SCULPTED EYEBROWS (MULTI-STROKE)
      ------------------------------------------------------------- */}
      {/* Left Eyebrow */}
      <path
        d="M 34.5 33.5 Q 40.5 30.5 47 32.5"
        stroke={hairColor}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M 36 32.5 Q 41 30 46 32"
        stroke="#ffffff"
        strokeWidth="0.6"
        strokeOpacity="0.2"
        fill="none"
      />
      {/* Right Eyebrow */}
      <path
        d="M 53 32.5 Q 59.5 30.5 65.5 33.5"
        stroke={hairColor}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M 54 32 Q 59 30 64 32.5"
        stroke="#ffffff"
        strokeWidth="0.6"
        strokeOpacity="0.2"
        fill="none"
      />

      {/* -------------------------------------------------------------
          7. 3D NOSE WITH BRIDGE, NOSTRILS & HIGHLIGHT
      ------------------------------------------------------------- */}
      {/* Nose Bridge Contour */}
      <path
        d="M 48.5 34 L 48 44 Q 48 46.5 50 46.8 Q 52 46.5 52 44 L 51.5 34"
        stroke="#000000"
        strokeWidth="0.8"
        strokeOpacity="0.22"
        fill="none"
      />
      {/* Nose Bridge Highlight */}
      <line x1="50" y1="35" x2="50" y2="44.5" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.28" strokeLinecap="round" />
      {/* Rounded Nose Tip */}
      <ellipse cx="50" cy="45" rx="2.4" ry="1.6" fill={skinTone} />
      <circle cx="50" cy="44.5" r="0.9" fill="#ffffff" fillOpacity="0.32" />
      {/* Shaded Nostrils */}
      <path d="M 46.5 46 Q 48 45.2 49 46.4" stroke="#000000" strokeWidth="1.1" strokeOpacity="0.45" fill="none" strokeLinecap="round" />
      <path d="M 53.5 46 Q 52 45.2 51 46.4" stroke="#000000" strokeWidth="1.1" strokeOpacity="0.45" fill="none" strokeLinecap="round" />

      {/* Philtrum Groove */}
      <line x1="49.3" y1="47.5" x2="49.3" y2="50.2" stroke="#000000" strokeWidth="0.7" strokeOpacity="0.2" />
      <line x1="50.7" y1="47.5" x2="50.7" y2="50.2" stroke="#000000" strokeWidth="0.7" strokeOpacity="0.2" />

      {/* -------------------------------------------------------------
          8. NATURAL LIPS & CHIN CONTOUR
      ------------------------------------------------------------- */}
      {/* Upper Lip Shadow & Cupid's Bow */}
      <path
        d="M 43.5 51.2 Q 47 50.4 50 51.2 Q 53 50.4 56.5 51.2 Q 50 53 43.5 51.2 Z"
        fill="#000000"
        fillOpacity="0.3"
      />
      {/* Mouth Separation Line */}
      <path
        d="M 43 51.8 Q 50 53.2 57 51.8"
        stroke="#1c1917"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Lower Lip Fullness & Highlight */}
      <path
        d="M 44.5 52 Q 50 56.5 55.5 52 Q 50 53.5 44.5 52 Z"
        fill="#000000"
        fillOpacity="0.22"
      />
      <ellipse cx="50" cy="53.8" rx="3.2" ry="1.1" fill="#ffffff" fillOpacity="0.18" />

      {/* Chin Indentation Dimple/Shadow */}
      <path d="M 47.5 57.5 Q 50 58.5 52.5 57.5" stroke="#000000" strokeWidth="1" strokeOpacity="0.25" fill="none" strokeLinecap="round" />

      {/* -------------------------------------------------------------
          9. FACIAL HAIR (STUBBLE / GOATEE / BEARD)
      ------------------------------------------------------------- */}
      {facialHair === 'stubble' && (
        <g stroke={hairColor} strokeWidth="1.2" strokeOpacity="0.45" strokeDasharray="1 1.8" fill="none">
          <path d="M 35 48 C 39 58, 61 58, 65 48" />
          <path d="M 38 52 C 43 60, 57 60, 62 52" />
          <path d="M 44 49.5 Q 50 49 56 49.5" />
        </g>
      )}

      {facialHair === 'goatee' && (
        <g fill={hairColor} fillOpacity="0.88">
          {/* Mustache */}
          <path d="M 43.5 49.8 Q 50 48.8 56.5 49.8 Q 50 52 43.5 49.8 Z" />
          {/* Soul patch & Chin goatee */}
          <path d="M 47.5 54.5 L 52.5 54.5 L 51.5 60 Q 50 61.5 48.5 60 Z" />
        </g>
      )}

      {facialHair === 'beard' && (
        <g fill={hairColor} fillOpacity="0.92">
          {/* Full Jawline & Chin Beard */}
          <path
            d="M 31 43 C 31 59, 41 62.5, 50 62.5 C 59 62.5, 69 59, 69 43 C 66 52, 60 55.5, 50 55.5 C 40 55.5, 34 52, 31 43 Z"
          />
          {/* Mustache */}
          <path d="M 42.5 50 Q 50 48.5 57.5 50 Q 50 52.5 42.5 50 Z" />
          {/* Beard Texture Highlights */}
          <path
            d="M 35 48 C 37 57, 43 60, 50 60 C 57 60, 63 57, 65 48"
            stroke="#ffffff"
            strokeWidth="0.8"
            strokeOpacity="0.15"
            fill="none"
          />
        </g>
      )}

      {/* -------------------------------------------------------------
          10. LAYERED REALISTIC HAIRSTYLES
      ------------------------------------------------------------- */}
      {/* BUZZ CUT */}
      {hairStyle === 'buzz' && (
        <g>
          <path
            d="M 28 34 C 28 17, 72 17, 72 34 C 71 27, 63 22, 50 22 C 37 22, 29 27, 28 34 Z"
            fill={hairColor}
            fillOpacity="0.75"
          />
          <path
            d="M 28 34 C 28 17, 72 17, 72 34 C 71 27, 63 22, 50 22 C 37 22, 29 27, 28 34 Z"
            fill={`url(#hairShine_${idSuffix})`}
          />
        </g>
      )}

      {/* SHORT ATHLETIC CROP */}
      {hairStyle === 'short' && (
        <g>
          <path
            d="M 27 34 C 27 15, 73 15, 73 34 C 69 24, 61 21, 50 22 C 39 21, 31 24, 27 34 Z"
            fill={hairColor}
          />
          <path
            d="M 27 34 C 27 15, 73 15, 73 34 C 69 24, 61 21, 50 22 C 39 21, 31 24, 27 34 Z"
            fill={`url(#hairShine_${idSuffix})`}
          />
          {/* Hair locks & separation */}
          <path d="M 36 21 Q 42 17 48 23" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.25" fill="none" />
          <path d="M 52 22 Q 58 17 64 22" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.25" fill="none" />
        </g>
      )}

      {/* SKIN FADE WITH TEXTURED TOP */}
      {hairStyle === 'fade' && (
        <g>
          {/* Shaved Temple & Side Fade Gradients */}
          <path d="M 28 36 C 28 25, 34 23, 36 23 L 33 36 Z" fill={hairColor} fillOpacity="0.35" />
          <path d="M 72 36 C 72 25, 66 23, 64 23 L 67 36 Z" fill={hairColor} fillOpacity="0.35" />
          {/* Voluminous Pompadour / Textured Crop Top */}
          <path
            d="M 32 25 C 32 11, 68 11, 68 25 C 62 19, 56 18, 50 19 C 44 18, 38 19, 32 25 Z"
            fill={hairColor}
          />
          <path
            d="M 32 25 C 32 11, 68 11, 68 25 C 62 19, 56 18, 50 19 C 44 18, 38 19, 32 25 Z"
            fill={`url(#hairShine_${idSuffix})`}
          />
          {/* Directional Pomade Texture */}
          <path d="M 38 18 Q 45 14 54 18" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.3" fill="none" />
          <path d="M 44 16 Q 51 13 60 16" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.3" fill="none" />
        </g>
      )}

      {/* TEXTURED CURLS / AFRO COILS */}
      {(hairStyle === 'curly' || hairStyle === 'afro') && (
        <g fill={hairColor}>
          {/* Multi-layered curly clusters */}
          <circle cx="34" cy="21" r="6" />
          <circle cx="42" cy="16" r="6.5" />
          <circle cx="50" cy="15" r="7" />
          <circle cx="58" cy="16" r="6.5" />
          <circle cx="66" cy="21" r="6" />
          <circle cx="28" cy="28" r="5" />
          <circle cx="72" cy="28" r="5" />
          <circle cx="38" cy="20" r="4" fill="#ffffff" fillOpacity="0.15" />
          <circle cx="50" cy="18" r="4.5" fill="#ffffff" fillOpacity="0.15" />
          <circle cx="62" cy="20" r="4" fill="#ffffff" fillOpacity="0.15" />
        </g>
      )}

      {/* BRAIDED DREADLOCKS */}
      {hairStyle === 'dreads' && (
        <g fill={hairColor} stroke="#09090b" strokeWidth="0.6">
          <rect x="29" y="17" width="5" height="19" rx="2.5" transform="rotate(-18 29 17)" />
          <rect x="37" y="14" width="5.2" height="22" rx="2.6" transform="rotate(-8 37 14)" />
          <rect x="47.5" y="13" width="5.4" height="24" rx="2.7" />
          <rect x="58" y="14" width="5.2" height="22" rx="2.6" transform="rotate(8 58 14)" />
          <rect x="66" y="17" width="5" height="19" rx="2.5" transform="rotate(18 66 17)" />
          {/* Gold Hair Cuffs on select dreadlocks */}
          <rect x="38" y="24" width="5.4" height="2.5" rx="0.8" fill="#facc15" stroke="none" transform="rotate(-8 37 14)" />
          <rect x="58.5" y="22" width="5.4" height="2.5" rx="0.8" fill="#facc15" stroke="none" transform="rotate(8 58 14)" />
        </g>
      )}

      {/* SLICK BACK WITH POMADE SHINE */}
      {hairStyle === 'slick' && (
        <g>
          <path
            d="M 27 34 C 27 13, 73 13, 73 34 C 69 21, 60 18, 50 19 C 40 18, 31 21, 27 34 Z"
            fill={hairColor}
          />
          <path
            d="M 27 34 C 27 13, 73 13, 73 34 C 69 21, 60 18, 50 19 C 40 18, 31 21, 27 34 Z"
            fill={`url(#hairShine_${idSuffix})`}
          />
          {/* Comb Grooves */}
          <path d="M 33 24 Q 42 16 50 17 Q 58 16 67 24" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.35" fill="none" />
          <path d="M 36 21 Q 44 14 50 15 Q 56 14 64 21" stroke="#ffffff" strokeWidth="0.9" strokeOpacity="0.25" fill="none" />
        </g>
      )}

      {/* MOHAWK / MODERN CREST */}
      {hairStyle === 'mohawk' && (
        <g>
          {/* Shaved Temples */}
          <path d="M 28 36 C 28 25, 38 23, 40 23 L 34 36 Z" fill={hairColor} fillOpacity="0.3" />
          <path d="M 72 36 C 72 25, 62 23, 60 23 L 66 36 Z" fill={hairColor} fillOpacity="0.3" />
          {/* Styled Center Crest */}
          <path
            d="M 41 26 C 42 10, 48 8, 50 8 C 52 8, 58 10, 59 26 C 56 22, 53 21, 50 21 C 47 21, 44 22, 41 26 Z"
            fill={hairColor}
          />
          <path
            d="M 41 26 C 42 10, 48 8, 50 8 C 52 8, 58 10, 59 26 C 56 22, 53 21, 50 21 C 47 21, 44 22, 41 26 Z"
            fill={`url(#hairShine_${idSuffix})`}
          />
        </g>
      )}
    </svg>
  );
};

export const PlayerFaceCard: React.FC<PlayerFaceCardProps> = ({
  player,
  team,
  size = 'md',
  className = '',
  onClick,
  showDetails = true,
}) => {
  // Determine card theme (fallback to gold)
  const themeKey = player.likeness?.faceCardTheme || 'gold';
  const theme = CARD_THEMES[themeKey] || CARD_THEMES.gold;

  // Size scaling configurations
  const sizeClasses = {
    xs: 'w-24 h-36 p-1.5 text-[9px] rounded-xl',
    sm: 'w-32 h-48 p-2 text-[10px] rounded-2xl',
    md: 'w-44 h-64 p-3 text-xs rounded-2xl',
    lg: 'w-56 h-80 p-4 text-sm rounded-3xl',
    xl: 'w-64 h-92 p-5 text-sm rounded-3xl',
  };

  const avatarSizes = {
    xs: 50,
    sm: 70,
    md: 96,
    lg: 125,
    xl: 145,
  };

  const jerseyColor = team?.kit?.primary || '#0284c7';

  return (
    <div
      onClick={onClick}
      className={`relative select-none border-2 flex flex-col justify-between overflow-hidden transition-all duration-300 ${
        theme.bg
      } ${theme.border} ${sizeClasses[size]} ${
        onClick ? 'cursor-pointer hover:scale-105 hover:shadow-2xl' : ''
      } ${className}`}
    >
      {/* Background Energy Glow & Radial Sheen */}
      <div
        className={`absolute inset-0 bg-gradient-to-tr ${theme.accentGlow} pointer-events-none`}
      />
      {/* Textured Card Sheen Lines */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

      {/* TOP BAR: Rating, Position, Club Badge */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex flex-col leading-none">
          <span
            className={`font-['Chakra_Petch'] font-black tracking-tighter ${
              theme.ratingColor
            } ${
              size === 'xs'
                ? 'text-base'
                : size === 'sm'
                ? 'text-xl'
                : size === 'md'
                ? 'text-2xl'
                : 'text-3xl'
            }`}
          >
            {player.rating}
          </span>
          <span
            className={`font-mono font-bold uppercase tracking-wider ${
              theme.labelColor
            } ${size === 'xs' ? 'text-[8px]' : 'text-[10px]'}`}
          >
            {player.position}
          </span>
          {player.preferredFoot && size !== 'xs' && (
            <span className={`text-[8px] font-mono opacity-75 ${theme.labelColor}`}>
              {player.preferredFoot === 'Left' ? 'L-FT' : 'R-FT'}
            </span>
          )}
        </div>

        {/* Club Emblem / Badge */}
        {team ? (
          <ClubEmblem teamId={team.id} shortName={team.shortName} size={size === 'xs' ? 'xs' : 'sm'} />
        ) : (
          <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
            ⚽
          </div>
        )}
      </div>

      {/* CENTER: Player Face Avatar Portrait */}
      <div className="relative z-10 my-auto flex items-center justify-center">
        <PlayerFaceAvatar
          skinTone={player.likeness?.skinTone || '#d49b6a'}
          hairStyle={player.likeness?.hairStyle || 'short'}
          hairColor={player.likeness?.hairColor || '#1f2937'}
          facialHair={player.likeness?.facialHair || 'none'}
          jerseyColor={jerseyColor}
          size={avatarSizes[size]}
        />

        {/* Signature PlayStyle icon floating indicator */}
        {player.playStyles && player.playStyles.length > 0 && size !== 'xs' && (
          <div
            className="absolute bottom-0 right-1 p-1 rounded-full bg-black/60 border border-white/20 text-cyan-300 shadow"
            title={`PlayStyle: ${player.playStyles[0]}`}
          >
            <Sparkles className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* BOTTOM: Player Name Banner & Stats Grid */}
      <div className="relative z-10 w-full">
        {/* Name Banner */}
        <div
          className={`w-full py-0.5 px-1 rounded-lg border text-center font-['Chakra_Petch'] font-black uppercase tracking-wider truncate mb-1 shadow-sm backdrop-blur-sm ${theme.bannerBg}`}
        >
          {player.shortName || player.name.split(' ').pop()}
        </div>

        {/* Core Stats Hexagon / Grid */}
        {showDetails && size !== 'xs' && (
          <div className="grid grid-cols-6 gap-0.5 text-center font-mono">
            <StatPill label="PAC" value={player.stats.pace} colorClass={theme.statsColor} />
            <StatPill label="SHO" value={player.stats.shooting} colorClass={theme.statsColor} />
            <StatPill label="PAS" value={player.stats.passing} colorClass={theme.statsColor} />
            <StatPill label="DRI" value={player.stats.dribbling} colorClass={theme.statsColor} />
            <StatPill label="DEF" value={player.stats.defending} colorClass={theme.statsColor} />
            <StatPill label="PHY" value={player.stats.physicality} colorClass={theme.statsColor} />
          </div>
        )}
      </div>
    </div>
  );
};

const StatPill: React.FC<{ label: string; value: number; colorClass: string }> = ({
  label,
  value,
  colorClass,
}) => (
  <div className="flex flex-col items-center leading-tight">
    <span className={`text-[10px] md:text-xs font-black font-['Chakra_Petch'] ${colorClass}`}>
      {value}
    </span>
    <span className="text-[7px] md:text-[8px] opacity-75 uppercase tracking-tighter">
      {label}
    </span>
  </div>
);
