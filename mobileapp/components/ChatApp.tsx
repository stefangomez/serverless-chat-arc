import {
  Avatar,
  Box,
  Button,
  Center,
  Divider,
  HStack,
  Heading,
  NativeBaseProvider,
  ScrollView,
  Spacer,
  Text,
  VStack,
  useColorMode,
  useColorModeValue,
} from 'native-base';
import { ScrollViewComponent, StyleSheet, View } from 'react-native';

import React from 'react';
import appConfig from '../app-config.json';

const URL_ROOM_ID = 'default';
const DEFAULT_USERNAME = 'anon' + Math.floor(Math.random() * 10000);
const COLORS = {
  light: {
    chatBorder: 'teal.300',
    chatBg: 'gray.50',
    editableBg: 'teal.100',
    joinText: 'gray.600',
    chatText: 'gray.800',
    chatTextSelf: 'teal.600',
    timestamp: 'gray.600',
  },
  dark: {
    chatBorder: 'teal.600',
    chatBg: 'gray.900',
    editableBg: 'teal.500',
    joinText: 'gray.300',
    chatText: 'gray.100',
    chatTextSelf: 'teal.400',
    timestamp: 'gray.400',
  },
};

const createWebsocketConnection = (roomId: string, username: string, setConnection: any, setChats: any) => {
  setConnection((oldConnection: any) => {
    if (oldConnection?.socket) {
      oldConnection.socket.close();
    }
    return { socket: null, state: 'connecting' };
  });
  const newWsConn = new WebSocket(`${appConfig?.WSS || 'ws://10.0.0.72:3333/'}?roomId=${roomId}`);
  newWsConn.onopen = e => {
    setConnection({ socket: newWsConn, state: 'connected' });
    newWsConn.send(
      JSON.stringify({
        text: `${username} entered the room`,
        type: 'user_join',
        roomId,
        sentAt: new Date().getTime(),
        username,
      })
    );
  };

  newWsConn.onmessage = e => {
    const msg = JSON.parse(e.data);
    console.log('onmessage:msg', msg);
    setChats((prevChats: any[]) => [...prevChats, msg]);
  };

  newWsConn.onclose = () => {
    setConnection({ socket: null, state: 'disconnected' });
  };
  return newWsConn;
};

const ChatWindow = React.memo(({ chats, onUsernameChange, chatInputRef }: any) => {
  const [initialUsernameSet, setInitialUsernameSet] = React.useState<boolean>(false);
  const usernameInputRef = React.useRef<HTMLInputElement>(null);
  const chatBoxRef = React.useRef<ScrollViewComponent>(null);
  const colors = useColorModeValue(COLORS.light, COLORS.dark);
  // const [playRcvFx] = useSound(imRcvFx);
  // const [playSndFx] = useSound(imSndFx);
  // const [playJoinFx] = useSound(doorOpenFx);
  // const [playLeaveFx] = useSound(doorSlamFx);
  // const [playFirstIncomingFx] = useSound(ringFx);
  const groupedChats: any = React.useMemo(() => {
    let lastChat: any = null;
    let incomingMessageCount = 0;
    const grouped = [];
    const usernameMap: any = {};
    chats.forEach((chat: any) => {
      usernameMap[chat.connectionId] = chat.sender;
      if (chat.type === 'message' && !chat.isSelf) {
        incomingMessageCount += 1;
      }
      if (lastChat && lastChat.connectionId === chat.connectionId && lastChat.type === chat.type) {
        // lastChat.sender = chat.sender;
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
    return { usernameMap, chats: grouped, lastChat, incomingMessageCount };
  }, [chats]);

  const onSetUsername = React.useCallback(() => {
    const newUsername = usernameInputRef?.current?.value?.trim();
    onUsernameChange(newUsername);
    setInitialUsernameSet(true);
  }, [onUsernameChange, usernameInputRef]);

  React.useEffect(() => {
    if (chatBoxRef?.current) {
      console.log('groupedChats', groupedChats);
      // if (groupedChats.chats.length && groupedChats.lastChat) {
      //   const lastChatType = groupedChats.lastChat.type;
      //   if (lastChatType === 'message') {
      //     if (groupedChats.lastChat.isSelf) {
      //       playSndFx();
      //     } else {
      //       // if (groupedChats.incomingMessageCount === 1) {
      //       //   playFirstIncomingFx();
      //       // } else {
      //       playRcvFx();
      //       // }
      //     }
      //   }
      //   if (lastChatType === 'user_join') {
      //     playJoinFx();
      //   }
      //   if (lastChatType === 'user_leave') {
      //     playLeaveFx();
      //   }
      // }
      chatBoxRef.current.scrollToEnd();
    }
  }, [groupedChats]);

  const onUsernameInputKeyup = React.useCallback(
    (e: any) => {
      if (e.key === 'Enter') {
        onSetUsername();
      }
    },
    [onSetUsername]
  );

  return (
    <ScrollView
      height='100%'
      w='100%'
      borderColor={colors.chatBorder}
      bg={colors.chatBg}
      borderWidth='3px'
      borderRadius='10px'
      ref={chatBoxRef}
    >
      <VStack py={3} px={4} space={2}>
        {groupedChats.chats.map((chat: any) => {
          const sender = groupedChats.usernameMap[chat.connectionId] || chat.sender;
          return (
            <React.Fragment key={chat.messageId}>
              {chat && chat.type === 'message' && (
                <HStack
                  alignItems='flex-start'
                  _text={{ color: chat.isSelf ? colors.chatTextSelf : colors.chatText, textAlign: 'center' }}
                  w='100%'
                  space={2}
                >
                  <Avatar borderRadius={4} mt={1} w={10} h={10}>
                    {sender[0].toUpperCase()}
                  </Avatar>
                  <VStack space={0} mt={1} alignItems='flex-start'>
                    <HStack alignItems='center' space={1}>
                      <Text fontWeight='bold'>{sender}</Text>
                      <Text fontSize={11} color={colors.timestamp}>
                        {new Date(chat.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </HStack>
                    {chat.messages.map((c: any) => (
                      <Text key={c.messageId}>{c.text.replace(/ {2}/g, ' \u00a0')}</Text>
                    ))}
                  </VStack>
                </HStack>
              )}
              {chat && chat.type === 'user_join' && (
                <Box pt={4} h={8} _text={{ color: colors.joinText, textAlign: 'center' }} w='100%'>
                  <Divider />
                  <Center mt={-3}>
                    <Text py={0} px={4} bg={colors.chatBg}>
                      <Text bold>{chat.messages.map((m: any) => m.sender).join(', ')}</Text> joined ({chat.numUsers}{' '}
                      user
                      {chat.numUsers > 1 ? 's' : ''})
                    </Text>
                  </Center>
                </Box>
              )}
              {chat && chat.type === 'user_leave' && (
                <Box pt={4} h={8} _text={{ color: colors.joinText, textAlign: 'center' }} w='100%'>
                  <Divider />
                  <Center mt={-3}>
                    <Text pos='relative' px={4} py={0} bg={colors.chatBg}>
                      <Text bold>{chat.messages.map((m: any) => m.sender).join(', ')}</Text> left ({chat.numUsers} user
                      {chat.numUsers > 1 ? 's' : ''})
                    </Text>
                  </Center>
                </Box>
              )}
              {chat && chat.type === 'user_rename' && (
                <Box pt={4} h={8} _text={{ color: colors.joinText, textAlign: 'center' }} w='100%'>
                  <Divider />
                  <Center mt={-3}>
                    <Text pos='relative' py={0} px={4} bg={colors.chatBg}>
                      <Text bold>{chat.oldUsername || chat.connectionId}</Text> is now <Text bold>{chat.sender}</Text>
                    </Text>
                  </Center>
                </Box>
              )}
            </React.Fragment>
          );
        })}

        {groupedChats.length === 0 && <Text>Waiting for chats</Text>}
      </VStack>
    </ScrollView>
  );
});

const LocalWrapper = ({ children }: any) => {
  const bg = useColorModeValue('gray.200', 'gray.800');
  return (
    <Center flex={1} bg={bg}>
      {children}
    </Center>
  );
};

export default function () {
  const { colorMode, toggleColorMode } = useColorMode();
  const [connection, setConnection] = React.useState<any>({ socket: null, state: 'disconnected' });
  const [username, setUsername] = React.useState(DEFAULT_USERNAME);
  const [chats, setChats] = React.useState<any[]>([]);
  const [roomId, setRoomId] = React.useState<string>(URL_ROOM_ID);
  //   console.log('connection', connection);
  const onRoomChange = React.useCallback(
    (newRoomId: string) => {
      if (newRoomId && newRoomId !== roomId) {
        setRoomId(newRoomId);
        // window.history.replaceState(null, document.title, `/${newRoomId}`);
        setChats([]);
      }
    },
    [roomId]
  );
  const onUsernameChange = React.useCallback(
    (newUsername: string) => {
      const updatedUsername = newUsername || DEFAULT_USERNAME;
      setUsername(updatedUsername);
      connection?.socket?.send(
        JSON.stringify({
          text: `${username} is now ${updatedUsername}`,
          type: 'user_rename',
          roomId,
          sentAt: new Date().getTime(),
          oldUsername: username,
          username: updatedUsername,
        })
      );

      chatInputRef?.current?.focus();
    },
    [connection, roomId, username]
  );
  // const onDisconnect = React.useCallback(() => connection.socket.close(), [connection]);
  const onReconnect = React.useCallback(() => connectToWs(roomId), [roomId]);

  const connectToWs = (roomId: string) => createWebsocketConnection(roomId, username, setConnection, setChats);

  React.useEffect(() => {
    connectToWs(roomId);
    // document.title = `Serverless Chat Room: ${roomId}`;
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
    <LocalWrapper>
      <VStack space={4} flex={1} w='90%' mt={10} mb={10}>
        <Heading color='emerald.400'>Todo App</Heading>
        <Box>Hello world</Box>
        <Button
          //   colorScheme={colorMode === 'light' ? 'blue' : 'red'}
          onPress={() => {
            toggleColorMode();
          }}
        >
          Change mode
        </Button>
        <ChatWindow chats={chats} />
      </VStack>
    </LocalWrapper>
  );
}
