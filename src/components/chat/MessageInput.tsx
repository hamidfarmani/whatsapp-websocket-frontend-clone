'use client';

import { ActiveChat } from '@/app/page';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { ChangeEvent, FormEvent } from 'react';
import { SendIcon, SmileIcon } from './Icons';

interface MessageInputProps {
  message: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSendMessage: (e: FormEvent) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  onEmojiClick: (emojiData: EmojiClickData, event: MouseEvent) => void;
  isConnected: boolean;
  activeChat: ActiveChat;
}

export function MessageInput({
  message,
  handleInputChange,
  handleSendMessage,
  showEmojiPicker,
  setShowEmojiPicker,
  onEmojiClick,
  isConnected,
  activeChat,
}: MessageInputProps) {
  return (
    <CardFooter className="border-t p-4 bg-white dark:bg-gray-800 relative flex-shrink-0">
      <form
        onSubmit={handleSendMessage}
        className="flex w-full items-center space-x-2"
      >
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="flex-shrink-0"
              disabled={!isConnected}
            >
              <SmileIcon className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 border-0"
            side="top"
            align="start"
          >
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </PopoverContent>
        </Popover>
        <Input
          type="text"
          placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
          value={message}
          onChange={handleInputChange}
          className="flex-1"
          autoComplete="off"
          onFocus={() => setShowEmojiPicker(false)}
          disabled={!isConnected || !activeChat}
          aria-label="Message input"
        />
        <Button
          type="submit"
          size="icon"
          className="bg-green-600 hover:bg-green-700 flex-shrink-0"
          disabled={!isConnected || !activeChat || !message.trim()}
          aria-label="Send message"
        >
          <SendIcon className="h-4 w-4" />
        </Button>
      </form>
    </CardFooter>
  );
}
