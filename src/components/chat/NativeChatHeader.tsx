'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface NativeChatHeaderProps {
  chatName: string;
}

export function NativeChatHeader({ chatName }: NativeChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b bg-gray-100 dark:bg-gray-800">
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src="/placeholder-avatar.jpg" alt="Chat Avatar" />
          <AvatarFallback>
            {chatName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {chatName}
          </p>
        </div>
      </div>
    </div>
  );
}
