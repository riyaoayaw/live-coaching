import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface PersonAvatarProps {
  name: string;
  profileImage?: string;
}

export default function PersonAvatar({ name, profileImage }: PersonAvatarProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center">
      <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
        <AvatarImage src={profileImage} alt={name} />
        <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="mt-3 text-center">
        <h3 className="font-semibold text-lg">{name}</h3>
        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1"></div>
        <p className="text-xs text-muted-foreground mt-1">Online</p>
      </div>
    </div>
  );
}