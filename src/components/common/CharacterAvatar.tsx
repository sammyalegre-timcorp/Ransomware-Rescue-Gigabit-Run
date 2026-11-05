import React from 'react';
import { CharacterId } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';

interface CharacterAvatarProps {
  characterId: CharacterId;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'giant';
  className?: string;
  glow?: boolean;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  characterId,
  size = 'md',
  className = '',
  glow = true
}) => {
  const char = CHARACTERS[characterId];
  if (!char) return null;

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
    giant: 'w-48 h-48 md:w-56 md:h-56'
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}
      style={{
        filter: glow ? `drop-shadow(0 0 16px ${char.glowColor})` : undefined
      }}
      dangerouslySetInnerHTML={{ __html: char.avatarSvg }}
    />
  );
};
