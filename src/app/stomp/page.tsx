'use client';

import { MessageList } from '@/components/chat/MessageList';
import { NativeChatHeader } from '@/components/chat/NativeChatHeader';
import { NativeJoinChatForm } from '@/components/chat/NativeJoinChatForm';
import { NativeMessageInput } from '@/components/chat/NativeMessageInput';
import { Button } from '@/components/ui/button';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { EmojiClickData } from 'emoji-picker-react';
import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';

export interface BaseMessage {
  user: string;
  text: string;
}
export interface SystemMessage extends BaseMessage {
  type: 'system';
  user: 'System';
}
export interface ChatMessage extends BaseMessage {
  type: 'CHAT' | 'JOIN' | 'LEAVE';
  sender: string;
  content: string;
  timestamp?: string;
}
export type AnyMessage = ChatMessage | SystemMessage;

function isSystemMessage(msg: AnyMessage): msg is SystemMessage {
  return 'type' in msg && msg.type === 'system';
}

export default function StompWsPage() {
  const stompClientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);

  const [username, setUsername] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<AnyMessage[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem(
      'whatsapp_clone_username_stomp',
    );
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  useEffect(() => {
    if (username) {
      localStorage.setItem('whatsapp_clone_username_stomp', username);
    }
  }, [username]);

  const connectStomp = useCallback(() => {
    if (!hasJoined || stompClientRef.current?.active) {
      console.log(
        '[STOMP WS] Skipping connect: already connected or user has not joined.',
      );
      return;
    }

    console.log('[STOMP WS] Attempting to initialize STOMP connection...');

    const socketFactory = () => new SockJS('http://localhost:8080/ws');

    const client = new Client({
      webSocketFactory: socketFactory,
      connectHeaders: {
        // Optional: login: 'user', passcode: 'password'
      },
      debug: function (str) {
        console.log('[STOMP DEBUG]', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: frame => {
        console.log('[STOMP WS] Connected:', frame);
        setIsConnected(true);
        setJoinError(null);

        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
        }
        subscriptionRef.current = client.subscribe(
          '/topic/public',
          (message: IMessage) => {
            console.log('[STOMP WS] Received raw message:', message.body);
            try {
              const receivedMsg: ChatMessage = JSON.parse(message.body);
              let displayUser = receivedMsg.sender;
              let displayText = receivedMsg.content;

              if (
                receivedMsg.sender === username &&
                receivedMsg.type === 'CHAT'
              ) {
                return;
              }

              if (receivedMsg.type === 'JOIN') {
                displayText = `${receivedMsg.sender} joined!`;
              } else if (receivedMsg.type === 'LEAVE') {
                displayText = `${receivedMsg.sender} left.`;
              }

              if (receivedMsg.type === 'JOIN' || receivedMsg.type === 'LEAVE') {
                setMessages(prev => [
                  ...prev,
                  {
                    type: 'system',
                    user: 'System',
                    text: displayText,
                  },
                ]);
                return;
              }

              setMessages(prev => [
                ...prev,
                {
                  user: displayUser,
                  text: displayText,
                  type: receivedMsg.type,
                  sender: receivedMsg.sender,
                  content: receivedMsg.content,
                  timestamp: new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                },
              ]);
            } catch (error) {
              console.error(
                '[STOMP WS] Error parsing received message:',
                error,
              );
            }
          },
        );

        client.publish({
          destination: '/app/chat.addUser',
          body: JSON.stringify({ sender: username, type: 'JOIN' }),
        });
      },
      onStompError: frame => {
        console.error(
          '[STOMP WS] Broker reported error: ' + frame.headers['message'],
        );
        console.error('[STOMP WS] Additional details: ' + frame.body);
        setJoinError(`STOMP Error: ${frame.headers['message']}`);
        setIsConnected(false);
        setHasJoined(false);
      },
      onWebSocketError: error => {
        console.error('[STOMP WS] WebSocket Error', error);
        setJoinError('WebSocket connection error. Is the backend running?');
        setIsConnected(false);
        setHasJoined(false);
      },
      onDisconnect: frame => {
        console.log('[STOMP WS] Disconnected:', frame);
        setIsConnected(false);
        setMessages(prev => [
          ...prev,
          { type: 'system', user: 'System', text: 'Disconnected' },
        ]);
        if (subscriptionRef.current) {
          subscriptionRef.current = null;
        }
      },
    });

    client.activate();
    stompClientRef.current = client;
  }, [hasJoined, username]);

  useEffect(() => {
    if (hasJoined) {
      connectStomp();
    }
    return () => {
      if (!hasJoined && stompClientRef.current?.active) {
        console.log(
          '[STOMP WS] Deactivating STOMP client due to unjoin/unmount.',
        );
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
        setIsConnected(false);
      }
    };
  }, [hasJoined, connectStomp]);

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
  }, [messages]);

  const handleJoinChat = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (username.trim()) {
        setHasJoined(true);
        setJoinError(null);
        setMessages([]);
      } else {
        setJoinError('Please enter a username.');
      }
    },
    [username],
  );

  const handleSendMessage = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const client = stompClientRef.current;
      if (!message.trim() || !client || !isConnected || !hasJoined) return;

      const chatMessage = {
        sender: username,
        content: message.trim(),
        type: 'CHAT',
      };

      client.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(chatMessage),
      });

      setMessages(prev => [
        ...prev,
        {
          user: 'You',
          text: chatMessage.content,
          type: 'CHAT',
          sender: username,
          content: chatMessage.content,
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);

      setMessage('');
      setShowEmojiPicker(false);
    },
    [isConnected, hasJoined, message, username],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(e.target.value);
    },
    [],
  );

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(message + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  if (!hasJoined) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md space-y-4">
          <NativeJoinChatForm
            username={username}
            setUsername={setUsername}
            handleJoin={handleJoinChat}
            joinError={joinError}
            isLoading={!isConnected && stompClientRef.current?.state === 1}
          />
          <div className="text-center">
            <Link href="/" passHref>
              <Button variant="link">Switch to Socket.IO Chat</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-1 flex-col">
        <NativeChatHeader
          chatName={
            username ? `STOMP Chat (${username})` : 'STOMP WebSocket Chat'
          }
        />
        <MessageList messages={messages} scrollAreaRef={scrollAreaRef} />
        <NativeMessageInput
          message={message}
          handleInputChange={handleInputChange}
          handleSendMessage={handleSendMessage}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          onEmojiClick={onEmojiClick}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
}
