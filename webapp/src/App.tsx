import * as React from 'react';
import {
  ChakraProvider,
  Box,
  Text,
  Link,
  VStack,
  Grid,
  theme,
  Icon,
  HStack,
  Heading,
  Editable,
  EditablePreview,
  EditableInput,
  Input,
  Badge,
} from '@chakra-ui/react';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import { ImGithub } from 'react-icons/im';

const DEFAULT_USERNAME = 'anon' + Math.floor(Math.random() * 10000);

export const App = () => {
  const [socket, setSocket] = React.useState<any>(null);
  const [connectionState, setConnectionState] = React.useState('connecting');

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
    newWsConn.onopen = () => {
      setConnectionState('connected');
    };

    newWsConn.onmessage = e => {
      const msg = JSON.parse(e.data);
      setChats((prevChats: any[]) => [...prevChats, msg]);
    };

    newWsConn.onclose = () => {
      setConnectionState('closed');
    };
    setSocket(newWsConn);

    return () => {
      newWsConn.close();
    };
  }, [roomId]);

  const chatInputRef = React.useRef<HTMLInputElement>(null);
  const sendMessage = React.useCallback(
    (text: string) => socket.send(JSON.stringify({ text, roomId, sentAt: new Date().getTime(), username })),
    [socket, roomId, username]
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
  const connectionStateColor = React.useMemo(() => {
    if (connectionState === 'connected') {
      return 'green';
    }
    if (connectionState === 'connecting') {
      return 'yellow';
    }
    return 'red';
  }, [connectionState]);
  return (
    <ChakraProvider theme={theme}>
      <Box textAlign='center' fontSize='xl'>
        <Grid minH='100vh' p={3}>
          <HStack h='fit-content' justifySelf='flex-end'>
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
            <HStack alignContent='flex-start'>
              <Badge ml='1' colorScheme={connectionStateColor}>
                {connectionState.toUpperCase()}
              </Badge>
              <Text fontSize='md'>Current Room: </Text>
              <Editable onSubmit={onRoomChange} defaultValue={roomId}>
                <EditablePreview />
                <EditableInput />
              </Editable>
            </HStack>
            <HStack alignContent='flex-start'>
              <Text fontSize='md'>Current Username: </Text>
              <Editable onSubmit={onUsernameChange} defaultValue={username}>
                <EditablePreview />
                <EditableInput />
              </Editable>
            </HStack>
          </VStack>
          <VStack spacing={2}>
            <Box
              h='50vmin'
              borderColor='teal.200'
              bgColor='gray.50'
              borderWidth='1px'
              borderRadius='10px'
              p='5'
              w='100%'
              overflowY='scroll'
            >
              <VStack fontSize='sm' w='100%' textAlign='left'>
                {chats.map(chat => (
                  <HStack key={chat.messageId} w='100%'>
                    <Text fontWeight='bold'>{chat.sender}</Text>
                    <Text>{chat.text}</Text>
                  </HStack>
                ))}
                {chats.length === 0 && <Text>Waiting for chats</Text>}
              </VStack>
            </Box>
            <Input
              disabled={connectionState !== 'connected'}
              ref={chatInputRef}
              onKeyUp={onChatInputKeyup}
              placeholder='Type a message to send...'
            />
          </VStack>
        </Grid>
      </Box>
    </ChakraProvider>
  );
};
