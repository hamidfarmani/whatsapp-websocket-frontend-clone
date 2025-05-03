'use client';

import { AnyMessage } from '@/app/page';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: AnyMessage;
}

function isSystemMessage(msg: AnyMessage): msg is {
  type: 'system';
  user: 'System';
  text: string;
} {
  return 'type' in msg && msg.type === 'system';
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (isSystemMessage(message)) {
    return (
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 my-2">
        --- {message.text} ---
      </div>
    );
  }

  const isOwnMessage = message.user === 'You';

  console.log(message);

  return (
    <div
      className={cn(
        'flex w-max max-w-[75%] flex-col gap-1 rounded-lg px-3 py-2 text-sm',
        isOwnMessage
          ? 'ml-auto bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100'
          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
      )}
    >
      {!isOwnMessage && (
        <p className="font-semibold text-xs text-blue-600 dark:text-blue-400">
          {message.user}
        </p>
      )}

      <p className="whitespace-pre-wrap break-words">{message.text}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
        {message.timestamp}
      </p>
    </div>
  );
}
