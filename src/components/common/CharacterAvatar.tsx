import React from 'react';
import { CharacterId } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';

interface CharacterAvatarProps {
  characterId: CharacterId;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'giant';
  className?: string;
  glow?: boolean;
  stepPhase?: number; // Alternates left/right leg stride on clicks/steps
  isMoving?: boolean;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  characterId,
  size = 'md',
  className = '',
  glow = true,
  stepPhase = 0,
  isMoving = false
}) => {
  const char = CHARACTERS[characterId];
  if (!char) return null;

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-28 h-28 md:w-32 md:h-32',
    giant: 'w-36 h-36 md:w-44 md:h-44'
  }[size];

  // Alternating step stride calculation (-1 or 1)
  const isLeftLead = stepPhase % 2 === 1;
  const leftLegAngle = isMoving || stepPhase > 0 ? (isLeftLead ? 24 : -24) : 0;
  const rightLegAngle = isMoving || stepPhase > 0 ? (isLeftLead ? -24 : 24) : 0;
  const bobOffset = isMoving || stepPhase > 0 ? (isLeftLead ? -2 : 0) : 0;

  // Render character specific components with animated legs & feet
  const renderCharacterGraphics = () => {
    switch (characterId) {
      case 'firewall_frank':
        return (
          <svg viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <linearGradient id="frankGlow" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF7A00" />
                <stop offset="1" stopColor="#FF0044" />
              </linearGradient>
              <radialGradient id="frankCore" cx="50" cy="45" r="25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFE600" />
                <stop offset="0.6" stopColor="#FF5500" />
                <stop offset="1" stopColor="#990000" />
              </radialGradient>
            </defs>

            {/* FEET & LEGS (Under Body) */}
            <g id="legs" style={{ transform: `translateY(${bobOffset}px)` }}>
              {/* Left Cyber Leg & Boot */}
              <g
                style={{
                  transformOrigin: '38px 75px',
                  transform: `rotate(${leftLegAngle}deg)`,
                  transition: 'transform 0.08s ease-out'
                }}
              >
                <line x1="38" y1="75" x2="35" y2="95" stroke="#FFAA00" strokeWidth="6" strokeLinecap="round" />
                {/* Left Heavy Cyber Boot */}
                <polygon points="26,95 44,95 47,105 22,105" fill="#FF5500" stroke="#FFF" strokeWidth="1.5" />
                {/* Glowing Sole Tread */}
                <rect x="22" y="103" width="25" height="4" rx="2" fill="#FFE600" />
              </g>

              {/* Right Cyber Leg & Boot */}
              <g
                style={{
                  transformOrigin: '62px 75px',
                  transform: `rotate(${rightLegAngle}deg)`,
                  transition: 'transform 0.08s ease-out'
                }}
              >
                <line x1="62" y1="75" x2="65" y2="95" stroke="#FFAA00" strokeWidth="6" strokeLinecap="round" />
                {/* Right Heavy Cyber Boot */}
                <polygon points="56,95 74,95 78,105 53,105" fill="#FF5500" stroke="#FFF" strokeWidth="1.5" />
                {/* Glowing Sole Tread */}
                <rect x="53" y="103" width="25" height="4" rx="2" fill="#FFE600" />
              </g>
            </g>

            {/* TORSO & SHIELD ARMOR */}
            <g style={{ transform: `translateY(${bobOffset}px)`, transition: 'transform 0.08s ease-out' }}>
              {/* Shield Base */}
              <path d="M50 5 L85 20 C85 58 50 82 50 82 C50 82 15 58 15 20 Z" fill="url(#frankGlow)" stroke="#FFF" strokeWidth="2.5" strokeLinejoin="round" />
              {/* Inner Fortress Core Plates */}
              <path d="M50 14 L75 26 C75 52 50 72 50 72 C50 72 25 52 25 26 Z" fill="#1A0B05" stroke="#FFAA00" strokeWidth="2" />
              {/* Core Grid */}
              <polygon points="50,28 65,37 65,55 50,64 35,55 35,37" fill="url(#frankCore)" stroke="#FFFFFF" strokeWidth="2" />
              {/* Brick Firewall Grid */}
              <line x1="38" y1="46" x2="62" y2="46" stroke="#FFE7BA" strokeWidth="2" />
              <line x1="50" y1="36" x2="50" y2="46" stroke="#FFE7BA" strokeWidth="2" />
              <line x1="44" y1="46" x2="44" y2="56" stroke="#FFE7BA" strokeWidth="2" />
              <line x1="56" y1="46" x2="56" y2="56" stroke="#FFE7BA" strokeWidth="2" />
              <circle cx="50" cy="46" r="3" fill="#FFFFFF" />
            </g>
          </svg>
        );

      case 'packet_pete':
        return (
          <svg viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <linearGradient id="peteGlow" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00F0FF" />
                <stop offset="1" stopColor="#0066FF" />
              </linearGradient>
            </defs>

            {/* FEET & LEGS */}
            <g id="legs" style={{ transform: `translateY(${bobOffset}px)` }}>
              {/* Left Photon Runner Leg & Sneaker */}
              <g
                style={{
                  transformOrigin: '38px 70px',
                  transform: `rotate(${leftLegAngle}deg)`,
                  transition: 'transform 0.08s ease-out'
                }}
              >
                <line x1="38" y1="70" x2="34" y2="92" stroke="#00F0FF" strokeWidth="5" strokeLinecap="round" />
                {/* Sleek Photon Sneaker */}
                <path d="M22 92 L42 92 L46 104 L18 104 Z" fill="#003566" stroke="#00F0FF" strokeWidth="1.5" />
                {/* Laser Light Sole */}
                <rect x="16" y="102" width="30" height="4" rx="2" fill="#00F0FF" />
              </g>

              {/* Right Photon Runner Leg & Sneaker */}
              <g
                style={{
                  transformOrigin: '62px 70px',
                  transform: `rotate(${rightLegAngle}deg)`,
                  transition: 'transform 0.08s ease-out'
                }}
              >
                <line x1="62" y1="70" x2="66" y2="92" stroke="#00F0FF" strokeWidth="5" strokeLinecap="round" />
                {/* Sleek Photon Sneaker */}
                <path d="M54 92 L74 92 L78 104 L50 104 Z" fill="#003566" stroke="#00F0FF" strokeWidth="1.5" />
                {/* Laser Light Sole */}
                <rect x="50" y="102" width="30" height="4" rx="2" fill="#00F0FF" />
              </g>
            </g>

            {/* BODY & DATA ENVELOPE */}
            <g style={{ transform: `translateY(${bobOffset}px)`, transition: 'transform 0.08s ease-out' }}>
              <path d="M10 28 L28 28 M6 44 L24 44" stroke="#00F0FF" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
              <polygon points="26,18 84,18 88,68 22,68" fill="url(#peteGlow)" stroke="#FFFFFF" strokeWidth="2.5" strokeLinejoin="round" />
              <polygon points="26,18 55,48 84,18" fill="#003566" stroke="#00FFFF" strokeWidth="2" />
              <polygon points="22,68 55,44 88,68" fill="#051923" stroke="#38BDF8" strokeWidth="1.5" opacity="0.7" />
              <circle cx="55" cy="38" r="7" fill="#FFFFFF" />
              <circle cx="55" cy="38" r="3.5" fill="#00E5FF" />
            </g>
          </svg>
        );

      case 'cyber_kat':
        return (
          <svg viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <linearGradient id="katGlow" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF2A85" />
                <stop offset="1" stopColor="#9D00FF" />
              </linearGradient>
            </defs>

            {/* FEET & LEGS */}
            <g id="legs" style={{ transform: `translateY(${bobOffset}px)` }}>
              {/* Left Cyber Cat Paw Leg */}
              <g
                style={{
                  transformOrigin: '36px 74px',
                  transform: `rotate(${leftLegAngle}deg)`,
                  transition: 'transform 0.08s ease-out'
                }}
              >
                <line x1="36" y1="74" x2="32" y2="94" stroke="#FF2A85" strokeWidth="5" strokeLinecap="round" />
                {/* Cyber Cat Paw Foot */}
                <ellipse cx="28" cy="100" rx="10" ry="5" fill="#9D00FF" stroke="#FFF" strokeWidth="1.5" />
                <circle cx="22" cy="100" r="2" fill="#00FFF0" />
                <circle cx="28" cy="99" r="2" fill="#00FFF0" />
                <circle cx="34" cy="100" r="2" fill="#00FFF0" />
              </g>

              {/* Right Cyber Cat Paw Leg */}
              <g
                style={{
                  transformOrigin: '64px 74px',
                  transform: `rotate(${rightLegAngle}deg)`,
                  transition: 'transform 0.08s ease-out'
                }}
              >
                <line x1="64" y1="74" x2="68" y2="94" stroke="#FF2A85" strokeWidth="5" strokeLinecap="round" />
                {/* Cyber Cat Paw Foot */}
                <ellipse cx="72" cy="100" rx="10" ry="5" fill="#9D00FF" stroke="#FFF" strokeWidth="1.5" />
                <circle cx="66" cy="100" r="2" fill="#00FFF0" />
                <circle cx="72" cy="99" r="2" fill="#00FFF0" />
                <circle cx="78" cy="100" r="2" fill="#00FFF0" />
              </g>
            </g>

            {/* HEAD & AR VISOR */}
            <g style={{ transform: `translateY(${bobOffset}px)`, transition: 'transform 0.08s ease-out' }}>
              <polygon points="22,10 38,32 18,40" fill="url(#katGlow)" stroke="#FFF" strokeWidth="2" />
              <polygon points="78,10 62,32 82,40" fill="url(#katGlow)" stroke="#FFF" strokeWidth="2" />
              <path d="M22,36 Q50,28 78,36 Q86,62 76,76 Q50,86 24,76 Q14,62 22,36 Z" fill="#140824" stroke="url(#katGlow)" strokeWidth="2.5" />
              <path d="M20,44 Q50,38 80,44 L76,58 Q50,54 24,58 Z" fill="#00FFF0" stroke="#FFF" strokeWidth="1.5" />
              <line x1="12" y1="64" x2="24" y2="66" stroke="#FF2A85" strokeWidth="2" strokeLinecap="round" />
              <line x1="88" y1="64" x2="76" y2="66" stroke="#FF2A85" strokeWidth="2" strokeLinecap="round" />
              <polygon points="47,66 53,66 50,70" fill="#FF2A85" />
            </g>
          </svg>
        );

      case 'agent_mal':
        return (
          <svg viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <linearGradient id="malGlow" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00FFA3" />
                <stop offset="1" stopColor="#007744" />
              </linearGradient>
            </defs>

            {/* FEET & LEGS */}
            <g id="legs" style={{ transform: `translateY(${bobOffset}px)` }}>
              {/* Left Antivirus Combat Boot */}
              <g
                style={{
                  transformOrigin: '38px 74px',
                  transform: `rotate(${leftLegAngle}deg)`,
                  transition: 'transform 0.08s ease-out'
                }}
              >
                <line x1="38" y1="74" x2="35" y2="94" stroke="#00FFA3" strokeWidth="6" strokeLinecap="round" />
                {/* Antivirus Armored Boot */}
                <polygon points="24,94 44,94 46,104 20,104" fill="#041B12" stroke="#00FFA3" strokeWidth="1.5" />
                <rect x="20" y="102" width="26" height="4" rx="2" fill="#00FFA3" />
              </g>

              {/* Right Antivirus Combat Boot */}
              <g
                style={{
                  transformOrigin: '62px 74px',
                  transform: `rotate(${rightLegAngle}deg)`,
                  transition: 'transform 0.08s ease-out'
                }}
              >
                <line x1="62" y1="74" x2="65" y2="94" stroke="#00FFA3" strokeWidth="6" strokeLinecap="round" />
                {/* Antivirus Armored Boot */}
                <polygon points="56,94 76,94 78,104 52,104" fill="#041B12" stroke="#00FFA3" strokeWidth="1.5" />
                <rect x="52" y="102" width="26" height="4" rx="2" fill="#00FFA3" />
              </g>
            </g>

            {/* BODY, HOOD & SCANNER STAFF */}
            <g style={{ transform: `translateY(${bobOffset}px)`, transition: 'transform 0.08s ease-out' }}>
              {/* Antivirus Hood & Visor */}
              <path d="M50 10 C34 10 24 26 24 48 C24 70 36 82 50 84 C64 82 76 70 76 48 C76 26 66 10 50 10 Z" fill="#041B12" stroke="url(#malGlow)" strokeWidth="2.5" />
              <ellipse cx="50" cy="44" rx="20" ry="12" fill="#000" stroke="#00FFA3" strokeWidth="1.5" />
              <circle cx="43" cy="44" r="4" fill="#00FFA3" />
              <circle cx="57" cy="44" r="4" fill="#00FFA3" />
              <circle cx="43" cy="44" r="1.5" fill="#FFF" />
              <circle cx="57" cy="44" r="1.5" fill="#FFF" />
              {/* Scanner Staff */}
              <line x1="84" y1="18" x2="84" y2="82" stroke="#00FFA3" strokeWidth="3" strokeLinecap="round" />
              <circle cx="84" cy="18" r="7" fill="#00FFA3" stroke="#FFF" strokeWidth="1.5" />
            </g>
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}
      style={{
        filter: glow ? `drop-shadow(0 0 16px ${char.glowColor})` : undefined
      }}
    >
      {renderCharacterGraphics()}
    </div>
  );
};
