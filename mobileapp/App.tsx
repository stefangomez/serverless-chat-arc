import { Box, Button, Center, Heading, NativeBaseProvider, Spacer, VStack, useColorMode } from 'native-base';
import { StyleSheet, Text, View } from 'react-native';

import ChatApp from './components/ChatApp';
import React from 'react';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <NativeBaseProvider>
      <ChatApp />
    </NativeBaseProvider>

    // <View style={styles.container}>
    //   <Text>Open up App.tsx to start working on your app!</Text>
    //   <StatusBar style="auto" />
    // </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
