'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Send, Smile } from 'lucide-react';
import { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react';

export interface NativeMessageInputProps {
  message: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSendMessage: (e: FormEvent) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: Dispatch<SetStateAction<boolean>>;
  onEmojiClick: (emojiData: EmojiClickData) => void;
  isConnected: boolean;
}

export function NativeMessageInput({
  message,
  handleInputChange,
  handleSendMessage,
  showEmojiPicker,
  setShowEmojiPicker,
  onEmojiClick,
  isConnected,
}: NativeMessageInputProps) {
  const canSendMessage = isConnected && message.trim() !== '';

  return (
    <form
      onSubmit={handleSendMessage}
      className="flex items-center p-3 border-t bg-gray-100 dark:bg-gray-800 relative"
    >
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={!isConnected}
        >
          <Smile className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <span className="sr-only">Open emoji picker</span>
        </Button>
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 mb-2 z-10">
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              lazyLoadEmojis
              width={350}
              height={400}
            />
          </div>
        )}
      </div>
      <Input
        type="text"
        placeholder={isConnected ? 'Type your message...' : 'Connecting...'}
        value={message}
        onChange={handleInputChange}
        className="flex-1 mx-2 bg-white dark:bg-gray-700 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={!isConnected}
        autoComplete="off"
        onFocus={() => setShowEmojiPicker(false)}
      />
      <Button
        type="submit"
        size="icon"
        disabled={!canSendMessage}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full disabled:opacity-50"
      >
        <Send className="h-5 w-5" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}
