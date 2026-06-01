import React from 'react';

interface AvatarProps {
  avatarUrl?: string;
  fallbackText?: string;
  size?: string;
  fontSize?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  avatarUrl, 
  fallbackText = '?', 
  size = '100%', 
  fontSize = 'inherit' 
}) => {
  const isUrl = avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.includes('/'));

  if (isUrl) {
    return (
      <img 
        src={avatarUrl} 
        alt="" 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: '50%', 
          objectFit: 'cover',
          display: 'block'
        }} 
      />
    );
  }

  return (
    <span style={{ fontSize }}>
      {avatarUrl || fallbackText[0]?.toUpperCase()}
    </span>
  );
};
