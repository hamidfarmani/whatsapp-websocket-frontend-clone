'use client';

import { ActiveChat } from '@/app/page';
import { CardHeader, CardTitle } from '@/components/ui/card';

interface ChatHeaderProps {
  activeChat: ActiveChat;
  typingIndicatorText: string | null;
}

export function ChatHeader({
  activeChat,
  typingIndicatorText,
}: ChatHeaderProps) {
  return (
    <CardHeader className="border-b p-4 flex-shrink-0">
      <CardTitle className="text-xl">
        {activeChat?.type === 'group' && `Group: ${activeChat.id}`}
        {activeChat?.type === 'dm' && `DM with ${activeChat.id}`}
        {!activeChat && 'Chat'}
      </CardTitle>
      <div className="h-4 text-xs text-gray-500 dark:text-gray-400 italic truncate">
        {typingIndicatorText || '\u00A0'}
      </div>
    </CardHeader>
  );
}
