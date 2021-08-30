import * as React from 'react';
import {
  ChakraProvider,
  Text,
  Link,
  VStack,
  theme,
  Icon,
  HStack,
  Heading,
  Editable,
  EditablePreview,
  EditableInput,
  Input,
  Badge,
  Avatar,
} from '@chakra-ui/react';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import { ImGithub } from 'react-icons/im';

const DEFAULT_USERNAME = 'anon' + Math.floor(Math.random() * 10000);

export const App = () => {
  const [connection, setConnection] = React.useState<any>({ socket: null, state: 'connecting' });

  const [username, setUsername] = React.useState(DEFAULT_USERNAME);
  const [chats, setChats] = React.useState<any[]>([]);
  const roomId = React.useMemo(() => window.location.pathname.slice(1) || 'default', []);
  const onRoomChange = React.useCallback(
    (newRoomId: string) => {
      if (newRoomId !== roomId) {
        window.location.href = '/' + newRoomId;
      }
    },
    [roomId]
  );

  const onUsernameChange = React.useCallback((newUsername: string) => {
    setUsername(newUsername || DEFAULT_USERNAME);
  }, []);

  React.useEffect(() => {
    const newWsConn = new WebSocket(`wss://ksi45cnjjb.execute-api.us-west-2.amazonaws.com/staging?roomId=${roomId}`);
    newWsConn.onopen = e => {
      setConnection({ socket: newWsConn, state: 'connected' });
    };

    newWsConn.onmessage = e => {
      const msg = JSON.parse(e.data);
      setChats((prevChats: any[]) => [...prevChats, msg]);
    };

    newWsConn.onclose = () => {
      setConnection({ socket: null, state: 'closed' });
    };

    return () => {
      newWsConn.close();
      setConnection({ socket: null, state: 'closed' });
    };
  }, [roomId]);

  const chatBoxRef = React.useRef<HTMLDivElement>(null);
  const chatInputRef = React.useRef<HTMLInputElement>(null);
  const sendMessage = React.useCallback(
    (text: string) =>
      connection?.socket?.send(JSON.stringify({ text, roomId, sentAt: new Date().getTime(), username })),
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

  const groupedChats = React.useMemo(() => {
    let lastChat: any = null;
    const grouped = [];
    chats.forEach(chat => {
      if (lastChat && lastChat.connectionId === chat.connectionId) {
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

  React.useEffect(() => {
    if (chatBoxRef?.current) {
      chatBoxRef.current.scrollTo({ top: chatBoxRef.current.scrollHeight });
    }
  }, [groupedChats]);

  return (
    <ChakraProvider theme={theme}>
      <VStack h='100vh' minHeight='stretch' p={3} spacing={4} align='stretch' textAlign='center'>
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
            <Badge colorScheme={connectionStateColor}>{connectionState.toUpperCase()}</Badge>
            <Heading size='sm' as='h3'>
              Current Room:
            </Heading>
            <Editable fontSize='sm' onSubmit={onRoomChange} defaultValue={roomId}>
              <EditablePreview cursor='pointer' px='2' bgColor='teal.100' />
              <EditableInput />
            </Editable>
          </HStack>
          <HStack alignContent='flex-start'>
            <Heading size='xs' as='h3'>
              Current Username:
            </Heading>
            <Editable fontSize='xs' onSubmit={onUsernameChange} defaultValue={username}>
              <EditablePreview cursor='pointer' px='2' bgColor='teal.100' />
              <EditableInput />
            </Editable>
          </HStack>
        </VStack>
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
          borderColor='teal.300'
          bgColor='gray.50'
          borderWidth='3px'
          borderRadius='10px'
        >
          {groupedChats.map(chat => {
            return (
              <HStack
                alignItems='flex-start'
                color={chat.isSelf ? 'teal.600' : 'gray.800'}
                key={chat.messageId}
                w='100%'
              >
                <Avatar borderRadius='4px' mt='3px' w='40px' h='40px' name={chat.sender} />
                <VStack spacing='0px' alignItems='flex-start'>
                  <HStack>
                    <Text fontWeight='bold'>{chat.sender}</Text>
                    <Text fontSize='11px' color='gray.600'>
                      {new Date(chat.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </HStack>
                  {chat.messages.map((c: any) => (
                    <Text key={c.messageId}>{c.text}</Text>
                  ))}
                </VStack>
              </HStack>
            );
          })}

          {chats.length === 0 && <Text>Waiting for chats</Text>}
        </VStack>
        <Input
          flex='0 0 auto'
          disabled={connectionState !== 'connected'}
          ref={chatInputRef}
          onKeyUp={onChatInputKeyup}
          placeholder='Type a message to send...'
        />
      </VStack>
    </ChakraProvider>
  );
};
