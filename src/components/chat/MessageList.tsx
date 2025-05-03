'use client';

import { AnyMessage } from '@/app/page';
import { CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import React from 'react';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: AnyMessage[];
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
}

export function MessageList({ messages, scrollAreaRef }: MessageListProps) {
  return (
    <ScrollArea
      className="flex-1 bg-gray-100 dark:bg-gray-900"
      ref={scrollAreaRef}
    >
      <CardContent className="p-4 space-y-4">
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}
      </CardContent>
    </ScrollArea>
  );
}
