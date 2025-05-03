'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChangeEvent, FormEvent } from 'react';

interface JoinChatFormProps {
  username: string;
  setUsername: (value: string) => void;
  newGroupInput: string;
  setNewGroupInput: (value: string) => void;
  recentGroups: string[];
  handleJoinGroup: (e: FormEvent, groupToJoin?: string) => void;
  isConnected: boolean;
  joinError: string | null;
  setJoinError: (error: string | null) => void;
}

export function JoinChatForm({
  username,
  setUsername,
  newGroupInput,
  setNewGroupInput,
  recentGroups,
  handleJoinGroup,
  isConnected,
  joinError,
  setJoinError,
}: JoinChatFormProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          Join or Create Chat
        </CardTitle>
        <CardDescription className="text-center min-h-[20px]">
          {joinError ? (
            <span className="text-red-500 font-semibold">{joinError}</span>
          ) : (
            <span>
              Status:{' '}
              {isConnected ? (
                <span className="text-green-500">Connected</span>
              ) : (
                <span className="text-red-500">Disconnected</span>
              )}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input /* Username Input */
          type="text"
          placeholder="Enter your name"
          value={username}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setUsername(e.target.value);
            setJoinError(null); // Clear error on change
          }}
          required
          className="w-full"
          aria-label="Username"
        />
        {recentGroups.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Recent Groups:
            </p>
            <div className="flex flex-wrap gap-2">
              {recentGroups.map(recentGroup => (
                <Button
                  key={recentGroup}
                  variant="outline"
                  size="sm"
                  onClick={e =>
                    handleJoinGroup(e as unknown as FormEvent, recentGroup)
                  }
                  disabled={!username.trim() || !isConnected}
                >
                  {recentGroup}
                </Button>
              ))}
            </div>
          </div>
        )}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-gray-800 px-2 text-muted-foreground">
              Or create new
            </span>
          </div>
        </div>
        <form onSubmit={handleJoinGroup} className="space-y-3">
          <Input
            type="text"
            placeholder="Enter new group name"
            value={newGroupInput}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNewGroupInput(e.target.value)
            }
            required
            className="w-full"
            disabled={!username.trim()}
            aria-label="New group name"
          />
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={!username.trim() || !newGroupInput.trim() || !isConnected}
          >
            Create & Join Group
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
