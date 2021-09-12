import * as React from 'react';

import {
  Avatar,
  Badge,
  Button,
  Editable,
  EditableInput,
  EditablePreview,
  HStack,
  Heading,
  Icon,
  IconButton,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';

import { ColorModeSwitcher } from './ColorModeSwitcher';
import { ImGithub } from 'react-icons/im';
import { MdRefresh } from 'react-icons/md';
import imRcvFx from './assets/imrcv.wav';
import imSndFx from './assets/imsend.wav';
import useSound from 'use-sound';

const URL_ROOM_ID = window.location.pathname.slice(1) || 'default';
const DEFAULT_USERNAME = 'anon' + Math.floor(Math.random() * 10000);
const COLORS = {
  light: {
    chatBorder: 'teal.300',
    chatBg: 'gray.50',
    editableBg: 'teal.100',
    chatText: 'gray.800',
    chatTextSelf: 'teal.600',
    timestamp: 'gray.600',
  },
  dark: {
    chatBorder: 'teal.600',
    chatBg: 'gray.900',
    editableBg: 'teal.500',
    chatText: 'gray.100',
    chatTextSelf: 'teal.400',
    timestamp: 'gray.400',
  },
};

const createWebsocketConnection = (roomId: string, setConnection: any, setChats: any) => {
  setConnection((oldConnection: any) => {
    if (oldConnection?.socket) {
      oldConnection.socket.close();
    }
    return { socket: null, state: 'connecting' };
  });
  const newWsConn = new WebSocket(`wss://ksi45cnjjb.execute-api.us-west-2.amazonaws.com/staging?roomId=${roomId}`);
  newWsConn.onopen = e => {
    setConnection({ socket: newWsConn, state: 'connected' });
  };

  newWsConn.onmessage = e => {
    const msg = JSON.parse(e.data);
    setChats((prevChats: any[]) => [...prevChats, msg]);
  };

  newWsConn.onclose = () => {
    setConnection({ socket: null, state: 'disconnected' });
  };
  return newWsConn;
};

const ChatWindow = React.memo(({ chats, colors, onUsernameChange, chatInputRef }: any) => {
  const [initialUsernameSet, setInitialUsernameSet] = React.useState<boolean>(false);
  const usernameInputRef = React.useRef<HTMLInputElement>(null);
  const chatBoxRef = React.useRef<HTMLDivElement>(null);
  const [playRcvFx] = useSound(imRcvFx);
  const [playSndFx] = useSound(imSndFx);
  const groupedChats: any[] = React.useMemo(() => {
    let lastChat: any = null;
    const grouped = [];
    chats.forEach((chat: any) => {
      if (lastChat && lastChat.connectionId === chat.connectionId) {
        lastChat.sender = chat.sender;
        lastChat.messages = [...(lastChat?.messages || []), chat];
      } else if (lastChat) {
        grouped.push(lastChat);
        lastChat = { ...chat, messages: [chat] };
      } else {
        lastChat = { ...chat, messages: [chat] };
      }
    });
    if (lastChat) {
      grouped.push(lastChat);
    }
    return grouped;
  }, [chats]);

  const onSetUsername = React.useCallback(() => {
    const newUsername = usernameInputRef?.current?.value?.trim();
    onUsernameChange(newUsername);
    setInitialUsernameSet(true);
  }, [onUsernameChange, usernameInputRef]);

  React.useEffect(() => {
    if (chatBoxRef?.current) {
      if (groupedChats.length && groupedChats[groupedChats.length - 1].isSelf) {
        playSndFx();
      } else if (groupedChats.length) {
        playRcvFx();
      }
      chatBoxRef.current.scrollTo({ top: chatBoxRef.current.scrollHeight });
    }
  }, [groupedChats, playSndFx, playRcvFx]);

  const onUsernameInputKeyup = React.useCallback(
    (e: any) => {
      if (e.key === 'Enter') {
        onSetUsername();
      }
    },
    [onSetUsername]
  );

  return (
    <>
      <VStack
        ref={chatBoxRef}
        py={3}
        px={4}
        flex='1 1 auto'
        w='100%'
        h='100%'
        overflowY='scroll'
        spacing={2}
        fontSize='sm'
        textAlign='left'
        borderColor={colors.chatBorder}
        bgColor={colors.chatBg}
        borderWidth='3px'
        borderRadius='10px'
      >
        {groupedChats.map(chat => {
          return (
            <HStack
              alignItems='flex-start'
              color={chat.isSelf ? colors.chatTextSelf : colors.chatText}
              key={chat.messageId}
              w='100%'
            >
              <Avatar borderRadius='4px' mt='3px' w='40px' h='40px' name={chat.sender} />
              <VStack spacing='0px' alignItems='flex-start'>
                <HStack>
                  <Text fontWeight='bold'>{chat.sender}</Text>
                  <Text fontSize='11px' color={colors.timestamp}>
                    {new Date(chat.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </HStack>
                {chat.messages.map((c: any) => (
                  <Text key={c.messageId}>{c.text.replace(/  /g, ' \u00a0')}</Text>
                ))}
              </VStack>
            </HStack>
          );
        })}

        {groupedChats.length === 0 && <Text>Waiting for chats</Text>}
      </VStack>
      <Modal
        initialFocusRef={usernameInputRef}
        finalFocusRef={chatInputRef}
        isOpen={!initialUsernameSet}
        onClose={() => setInitialUsernameSet(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Set your chat username</ModalHeader>
          <ModalBody>
            <Input ref={usernameInputRef} placeholder={DEFAULT_USERNAME} onKeyUp={onUsernameInputKeyup} />
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' onClick={onSetUsername}>
              Set Username
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
});

const CurrentUsername = React.memo(({ currentUsername, onUsernameChange, colors }: any) => {
  const [username, setUsername] = React.useState<string>(currentUsername);
  React.useEffect(() => {
    setUsername(currentUsername);
  }, [currentUsername]);
  return (
    <Editable fontSize='xs' onSubmit={onUsernameChange} value={username} onChange={val => setUsername(val)}>
      <EditablePreview cursor='pointer' px='2' bgColor={colors.editableBg} />
      <EditableInput />
    </Editable>
  );
});

export const App = () => {
  const [connection, setConnection] = React.useState<any>({ socket: null, state: 'disconnected' });
  const [username, setUsername] = React.useState(DEFAULT_USERNAME);
  const [chats, setChats] = React.useState<any[]>([]);
  const [roomId, setRoomId] = React.useState<string>(URL_ROOM_ID);
  // console.log('connection', connection);
  const onRoomChange = React.useCallback(
    (newRoomId: string) => {
      if (newRoomId && newRoomId !== roomId) {
        setRoomId(newRoomId);
        window.history.replaceState(null, document.title, `/${newRoomId}`);
        setChats([]);
      }
    },
    [roomId]
  );
  const onUsernameChange = React.useCallback((newUsername: string) => {
    setUsername(newUsername || DEFAULT_USERNAME);
    chatInputRef?.current?.focus();
  }, []);
  // const onDisconnect = React.useCallback(() => connection.socket.close(), [connection]);
  const onReconnect = React.useCallback(() => connectToWs(roomId), [roomId]);

  const connectToWs = (roomId: string) => createWebsocketConnection(roomId, setConnection, setChats);

  React.useEffect(() => {
    connectToWs(roomId);
    document.title = `Serverless Chat Room: ${roomId}`;
  }, [roomId]);

  React.useEffect(() => {
    if (connection?.state === 'connected') {
      chatInputRef?.current?.focus();
    }
  }, [connection]);

  const chatInputRef = React.useRef<HTMLInputElement>(null);
  const sendMessage = React.useCallback(
    (text: string) =>
      text && connection?.socket?.send(JSON.stringify({ text, roomId, sentAt: new Date().getTime(), username })),
    [connection, roomId, username]
  );
  const onChatInputKeyup = React.useCallback(
    (e: any) => {
      if (e.key === 'Enter') {
        sendMessage(e.target.value || '');
        if (chatInputRef?.current) {
          chatInputRef.current.value = '';
        }
      }
    },
    [sendMessage]
  );

  const connectionState = React.useMemo(() => connection?.state, [connection]);
  const connectionStateColor = React.useMemo(() => {
    if (connectionState === 'connected') {
      return 'green';
    }
    if (connectionState === 'connecting') {
      return 'yellow';
    }
    return 'red';
  }, [connectionState]);

  const colors = useColorModeValue(COLORS.light, COLORS.dark);

  return (
    <VStack
      css={{ height: ['100vh', '-webkit-fill-available'], width: ['100vw', '-webkit-fill-available'] }}
      p={3}
      spacing={4}
      align='stretch'
      textAlign='center'
      pos='fixed'
      top='0'
      left='0'
    >
      <HStack justify='flex-end'>
        <Link
          color='teal.500'
          href='https://github.com/stefangomez/serverless-chat-arc'
          fontSize='md'
          target='_blank'
          rel='noopener noreferrer'
        >
          <HStack>
            <Icon as={ImGithub} />
            <Text>GitHub</Text>
          </HStack>
        </Link>
        <ColorModeSwitcher />
      </HStack>
      <VStack spacing={2}>
        <Heading size='lg'>Serverless Chat App Demo</Heading>
        <HStack>
          {connectionState === 'disconnected' && (
            <IconButton aria-label='reconnect' icon={<MdRefresh />} size='xs' onClick={onReconnect} />
          )}
          {/* {connectionState === 'connected' && (
            <Button size='xs' onClick={onDisconnect}>
              Disconnect
            </Button>
          )} */}
          <Badge colorScheme={connectionStateColor}>{connectionState.toUpperCase()}</Badge>
          <Heading size='sm' as='h3'>
            Current Room:
          </Heading>
          <Editable fontSize='sm' onSubmit={onRoomChange} defaultValue={roomId}>
            <EditablePreview cursor='pointer' px='2' bgColor={colors.editableBg} />
            <EditableInput />
          </Editable>
        </HStack>
        <HStack alignContent='flex-start'>
          <Heading size='xs' as='h3'>
            Current Username:
          </Heading>
          <CurrentUsername currentUsername={username} onUsernameChange={onUsernameChange} colors={colors} />
        </HStack>
      </VStack>
      <ChatWindow chats={chats} colors={colors} onUsernameChange={onUsernameChange} chatInputRef={chatInputRef} />
      <Input
        flex='0 0 auto'
        // autoFocus={connectionState === 'connected'}
        disabled={connectionState !== 'connected'}
        ref={chatInputRef}
        onKeyUp={onChatInputKeyup}
        placeholder='Type a message to send...'
      />
    </VStack>
  );
};
