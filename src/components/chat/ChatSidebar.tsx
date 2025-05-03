'use client';

import { ActiveChat } from '@/app/page';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeftIcon, LogOutIcon } from './Icons';

const getInitials = (name: string) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
};

interface ChatSidebarProps {
  joinedGroup: string | null;
  users: string[];
  username: string;
  isConnected: boolean;
  activeChat: ActiveChat;
  handleOpenDm: (targetUsername: string) => void;
  handleBackToGroup: () => void;
  handleLeaveGroup: () => void;
}

export function ChatSidebar({
  joinedGroup,
  users,
  username,
  isConnected,
  activeChat,
  handleOpenDm,
  handleBackToGroup,
  handleLeaveGroup,
}: ChatSidebarProps) {
  return (
    <div className="w-1/4 border-r p-4 flex flex-col bg-gray-50 dark:bg-gray-700">
      {joinedGroup && activeChat?.type !== 'group' && (
        <Button
          variant="link"
          size="sm"
          onClick={handleBackToGroup}
          className="text-blue-600 dark:text-blue-400 px-0 h-auto mb-2 justify-start disabled:text-gray-400 disabled:no-underline"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Group Chat
        </Button>
      )}

      {activeChat?.type === 'group' && (
        <>
          <h4 className="text-base font-semibold mb-2 pt-2">
            Members ({users.length})
          </h4>
          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {users.map((user, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto px-2 py-1.5 text-left disabled:opacity-100 cursor-pointer disabled:cursor-default"
                  onClick={() => handleOpenDm(user)}
                  disabled={user === username}
                  aria-label={`Direct message ${user}`}
                >
                  <div className="flex items-center space-x-2 w-full">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate flex-1">
                      {user}
                    </span>
                    {user === username && (
                      <Badge
                        variant="outline"
                        className="ml-auto text-xs text-green-600 border-green-600 flex-shrink-0"
                      >
                        You
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      <div className="mt-auto border-t pt-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 overflow-hidden">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback>{getInitials(username)}</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate">{username}</p>
            <Badge
              variant="secondary"
              className={`h-5 text-xs ${
                isConnected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {isConnected ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLeaveGroup}
          className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900 flex-shrink-0"
          disabled={!isConnected}
          aria-label="Leave Group"
        >
          <LogOutIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
