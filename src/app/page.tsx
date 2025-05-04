'use client';

import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { JoinChatForm } from '@/components/chat/JoinChatForm';
import { MessageInput } from '@/components/chat/MessageInput';
import { MessageList } from '@/components/chat/MessageList';
import { Button } from '@/components/ui/button';
import { EmojiClickData } from 'emoji-picker-react';
import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export interface GroupChat {
  type: 'group';
  id: string;
}
export interface DmChat {
  type: 'dm';
  id: string;
}
export type ActiveChat = GroupChat | DmChat | null;

export interface BaseMessage {
  user: string;
  text: string;
}
export interface SystemMessage extends BaseMessage {
  type: 'system';
  user: 'System';
}
export interface ChatMessage extends BaseMessage {
  senderUsername?: string;
  recipientUsername?: string;
  isPrivate?: boolean;
  timestamp?: string;
}
export type AnyMessage = ChatMessage | SystemMessage;

let socketInstance: Socket | null = null;

function isSystemMessage(msg: AnyMessage): msg is SystemMessage {
  return 'type' in msg && msg.type === 'system';
}

const RECENT_GROUPS_KEY = 'whatsapp_clone_recent_groups';
const TYPING_TIMER_LENGTH = 1500;

export default function Home() {
  const [username, setUsername] = useState<string>('');
  const [newGroupInput, setNewGroupInput] = useState<string>('');
  const [activeChat, setActiveChat] = useState<ActiveChat>(null);
  const [joinedGroup, setJoinedGroup] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [groupMessages, setGroupMessages] = useState<AnyMessage[]>([]);
  const [dmMessages, setDmMessages] = useState<{ [key: string]: AnyMessage[] }>(
    {},
  );
  const [users, setUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recentGroups, setRecentGroups] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [dmTypingUsers, setDmTypingUsers] = useState<{
    [key: string]: boolean;
  }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    const storedUsername = localStorage.getItem('whatsapp_clone_username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
    const storedGroups = localStorage.getItem(RECENT_GROUPS_KEY);
    if (storedGroups) {
      setRecentGroups(JSON.parse(storedGroups));
    }
  }, []);

  useEffect(() => {
    if (username) {
      localStorage.setItem('whatsapp_clone_username', username);
    }
  }, [username]);

  useEffect(() => {
    if (typeof window === 'undefined' || socketInstance) {
      return;
    }

    console.log('Attempting to initialize socket connection...');
    const socket = io('http://localhost:3001');
    socketInstance = socket;

    const onConnect = () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      setJoinError(null);
    };

    const onDisconnect = () => {
      console.log('Socket disconnected.');
      setIsConnected(false);
      setJoinedGroup(null);
      setActiveChat(null);
      setGroupMessages([]);
      setUsers([]);
      setTypingUsers(new Set());
      setDmMessages({});
      setDmTypingUsers({});
    };

    const onJoinError = ({ message }: { message: string }) => {
      console.error('Join Error:', message);
      setJoinError(message);
      setActiveChat(null);
      setJoinedGroup(null);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('joinError', onJoinError);

    return () => {
      console.log('Cleaning up socket connection effect...');
      if (socketInstance) {
        console.log('Disconnecting socket instance:', socketInstance.id);
        socketInstance.off('connect', onConnect);
        socketInstance.off('disconnect', onDisconnect);
        socketInstance.off('joinError', onJoinError);
        if (socketInstance.connected) {
          socketInstance.disconnect();
        }
        socketInstance = null;
        setIsConnected(false);
      }
    };
  }, []);

  useEffect(() => {
    const socket = socketInstance;
    if (!socket || !isConnected) {
      return () => {};
    }

    console.log(
      `Setting up listeners for activeGroup: ${activeChat?.type} - ${activeChat?.id}`,
    );

    const handleNewMessage = (newMessage: AnyMessage) => {
      console.log('Received message:', newMessage);
      if (isSystemMessage(newMessage)) {
        setGroupMessages(prev => [...prev, newMessage]);
      } else if (newMessage.isPrivate) {
        const counterpart =
          newMessage.senderUsername === username
            ? newMessage.recipientUsername
            : newMessage.senderUsername;
        if (counterpart) {
          setDmMessages(prev => ({
            ...prev,
            [counterpart]: [...(prev[counterpart] || []), newMessage],
          }));
          setDmTypingUsers(prev => ({ ...prev, [counterpart]: false }));
        }
      } else {
        setGroupMessages(prev => [...prev, newMessage]);
        if (newMessage.senderUsername) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(newMessage.senderUsername as string);
            return newSet;
          });
        }
      }
    };

    const handleUserListUpdate = (updatedUsers: string[]) => {
      setUsers(updatedUsers);
    };

    const handleUserTyping = ({
      username: typingUsername,
      group,
      isPrivate,
    }: {
      username: string;
      group?: string;
      isPrivate?: boolean;
    }) => {
      if (isPrivate) {
        setDmTypingUsers(prev => ({ ...prev, [typingUsername]: true }));
      } else if (group === joinedGroup) {
        setTypingUsers(prev => new Set(prev).add(typingUsername));
      }
    };

    const handleUserStoppedTyping = ({
      username: stoppedUsername,
      group,
      isPrivate,
    }: {
      username: string;
      group?: string;
      isPrivate?: boolean;
    }) => {
      if (isPrivate) {
        setDmTypingUsers(prev => ({ ...prev, [stoppedUsername]: false }));
      } else if (group === joinedGroup) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(stoppedUsername);
          return newSet;
        });
      }
    };

    socket.on('message', handleNewMessage);
    socket.on('updateUserList', handleUserListUpdate);
    socket.on('userTyping', handleUserTyping);
    socket.on('userStoppedTyping', handleUserStoppedTyping);

    return () => {
      console.log(
        `Cleaning up listeners for activeGroup: ${activeChat?.type} - ${activeChat?.id}`,
      );
      socket.off('message', handleNewMessage);
      socket.off('updateUserList', handleUserListUpdate);
      socket.off('userTyping', handleUserTyping);
      socket.off('userStoppedTyping', handleUserStoppedTyping);
    };
  }, [isConnected, username, joinedGroup]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        'div[data-radix-scroll-area-viewport]',
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, [groupMessages, dmMessages]);

  const emitStopTyping = useCallback(() => {
    const socket = socketInstance;
    if (!socket || !isConnected || !isTypingRef.current || !activeChat) return;
    console.log(
      `Emitting stop typing for ${activeChat.type}: ${activeChat.id}`,
    );
    const payload =
      activeChat.type === 'group'
        ? { group: activeChat.id }
        : { recipientUsername: activeChat.id };
    socket.emit('stopTyping', payload);
    isTypingRef.current = false;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [isConnected, activeChat]);

  const addGroupToRecents = (groupName: string) => {
    setRecentGroups(prev => {
      const updatedGroups = [
        groupName,
        ...prev.filter(g => g !== groupName),
      ].slice(0, 10);
      localStorage.setItem(RECENT_GROUPS_KEY, JSON.stringify(updatedGroups));
      return updatedGroups;
    });
  };

  const handleLeaveGroup = useCallback(
    (resetUI = true) => {
      const socket = socketInstance;
      if (socket && isConnected && joinedGroup) {
        emitStopTyping();
        console.log(`Emitting leave for group: ${joinedGroup}`);
        socket.emit('leave', { username, group: joinedGroup });
        if (resetUI) {
          setActiveChat(null);
          setJoinedGroup(null);
          setGroupMessages([]);
          setUsers([]);
          setTypingUsers(new Set());
          setDmMessages({});
          setDmTypingUsers({});
        }
      }
    },
    [isConnected, joinedGroup, username, emitStopTyping],
  );

  const handleJoinGroup = useCallback(
    (e: FormEvent, groupToJoin?: string) => {
      e.preventDefault();
      const socket = socketInstance;
      if (!socket || !isConnected) return;
      const targetGroup = groupToJoin || newGroupInput;
      if (username.trim() && targetGroup.trim()) {
        if (joinedGroup && joinedGroup !== targetGroup) {
          handleLeaveGroup(false);
        }
        console.log(`Joining group: ${targetGroup} as ${username}`);
        socket.emit('join', { username, group: targetGroup });
        setJoinedGroup(targetGroup);
        setActiveChat({ type: 'group', id: targetGroup });
        setGroupMessages([]);
        setTypingUsers(new Set());
        setDmTypingUsers({});
        addGroupToRecents(targetGroup);
        setNewGroupInput('');
        setJoinError(null);
      }
    },
    [
      username,
      newGroupInput,
      isConnected,
      joinedGroup,
      handleLeaveGroup,
      addGroupToRecents,
    ],
  );

  const handleOpenDm = useCallback(
    (targetUsername: string) => {
      if (targetUsername === username) return;
      console.log(`Opening DM with ${targetUsername}`);
      setActiveChat({ type: 'dm', id: targetUsername });
      if (!dmMessages[targetUsername]) {
        setDmMessages(prev => ({ ...prev, [targetUsername]: [] }));
      }
      emitStopTyping();
    },
    [username, dmMessages, emitStopTyping],
  );

  const handleBackToGroup = useCallback(() => {
    if (joinedGroup) {
      setActiveChat({ type: 'group', id: joinedGroup });
      emitStopTyping();
    }
  }, [joinedGroup, emitStopTyping]);

  const handleSendMessage = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const socket = socketInstance;
      if (!message.trim() || !socket || !isConnected || !activeChat) return;

      emitStopTyping();

      const commonMessage = { user: username, text: message.trim() };

      if (activeChat.type === 'group') {
        console.log(`Sending group msg to ${activeChat.id}`);
        socket.emit('sendMessage', {
          group: activeChat.id,
          message: commonMessage,
        });
        setGroupMessages(prev => [
          ...prev,
          {
            ...commonMessage,
            user: 'You',
            timestamp: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]);
      } else {
        console.log(`Sending DM to ${activeChat.id}`);
        socket.emit('sendMessage', {
          recipientUsername: activeChat.id,
          message: commonMessage,
        });
      }
      setMessage('');
      setShowEmojiPicker(false);
    },
    [isConnected, activeChat, message, username, emitStopTyping],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(e.target.value);
      const socket = socketInstance;
      if (!socket || !isConnected || !activeChat) return;
      const payload =
        activeChat.type === 'group'
          ? { group: activeChat.id }
          : { recipientUsername: activeChat.id };
      if (!isTypingRef.current) {
        console.log(
          `Emitting start typing for ${activeChat.type}: ${activeChat.id}`,
        );
        socket.emit('startTyping', payload);
        isTypingRef.current = true;
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping();
      }, TYPING_TIMER_LENGTH);
    },
    [isConnected, activeChat, emitStopTyping],
  );

  const onEmojiClick = useCallback((emojiData: EmojiClickData) => {
    setMessage(prevInput => prevInput + emojiData.emoji);
    setShowEmojiPicker(false);
  }, []);

  const currentMessages =
    activeChat?.type === 'dm' ? dmMessages[activeChat.id] || [] : groupMessages;

  const typingIndicatorText = useCallback(() => {
    if (activeChat?.type === 'dm') {
      return dmTypingUsers[activeChat.id]
        ? `${activeChat.id} is typing...`
        : null;
    } else if (activeChat?.type === 'group') {
      const usersTyping = Array.from(typingUsers).filter(u => u !== username);
      if (usersTyping.length === 0) return null;
      if (usersTyping.length === 1) return `${usersTyping[0]} is typing...`;
      if (usersTyping.length === 2)
        return `${usersTyping[0]} and ${usersTyping[1]} are typing...`;
      return `${usersTyping.slice(0, 2).join(', ')} and others are typing...`;
    } else {
      return null;
    }
  }, [activeChat, typingUsers, dmTypingUsers, username]);

  if (!isConnected || !joinedGroup) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md space-y-4">
          <JoinChatForm
            username={username}
            setUsername={setUsername}
            newGroupInput={newGroupInput}
            setNewGroupInput={setNewGroupInput}
            recentGroups={recentGroups}
            handleJoinGroup={handleJoinGroup}
            isConnected={isConnected}
            joinError={joinError}
            setJoinError={setJoinError}
          />
          <div className="text-center">
            <Link href="/stomp" passHref>
              <Button variant="link">Switch to STOMP Chat</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <ChatSidebar
        joinedGroup={joinedGroup}
        users={users}
        username={username}
        isConnected={isConnected}
        activeChat={activeChat}
        handleOpenDm={handleOpenDm}
        handleBackToGroup={handleBackToGroup}
        handleLeaveGroup={handleLeaveGroup}
      />
      <div className="flex flex-1 flex-col">
        <ChatHeader
          activeChat={activeChat}
          typingIndicatorText={typingIndicatorText()}
        />
        <MessageList messages={currentMessages} scrollAreaRef={scrollAreaRef} />
        <MessageInput
          message={message}
          handleInputChange={handleInputChange}
          handleSendMessage={handleSendMessage}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          onEmojiClick={onEmojiClick}
          isConnected={isConnected}
          activeChat={activeChat}
        />
      </div>
    </div>
  );
}
