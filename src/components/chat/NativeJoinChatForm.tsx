'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dispatch, FormEvent, SetStateAction } from 'react';

export interface NativeJoinChatFormProps {
  username: string;
  setUsername: Dispatch<SetStateAction<string>>;
  handleJoin: (e: FormEvent) => void;
  joinError: string | null;
  isLoading: boolean;
}

export function NativeJoinChatForm({
  username,
  setUsername,
  handleJoin,
  joinError,
  isLoading,
}: NativeJoinChatFormProps) {
  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
        Join Native WebSocket Chat
      </h2>
      <form className="space-y-4" onSubmit={handleJoin}>
        <div>
          <label
            htmlFor="username-native"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Username
          </label>
          <Input
            id="username-native"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            className="mt-1"
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !username.trim()}
        >
          {isLoading ? 'Connecting...' : 'Join Chat'}
        </Button>

        {joinError && (
          <p className="text-sm text-red-600 dark:text-red-400 text-center">
            {joinError}
          </p>
        )}
      </form>
    </div>
  );
}
