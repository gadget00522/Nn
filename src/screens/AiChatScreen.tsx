import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { aiService, ChatMessage } from '../services/aiService';
import useWalletStore from '../store/walletStore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function AiChatScreen({ navigation }: any) {
  const theme = useTheme();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const walletAddress = useWalletStore((state) => state.address);
  const balance = useWalletStore((state) => state.balance);

  useEffect(() => {
    // Initial greeting
    const initialMessage: ChatMessage = {
      id: 'init',
      text: "Salut ! Je suis Malin. Je peux analyser tes transactions, te donner des conseils et t'aider à gérer ton portefeuille. Que veux-tu savoir ?",
      sender: 'malin',
      timestamp: Date.now(),
    };
    setMessages([initialMessage]);

    // Update context
    aiService.updateContext(walletAddress, balance);
  }, []);

  useEffect(() => {
     aiService.updateContext(walletAddress, balance);
  }, [walletAddress, balance]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const responseText = await aiService.getResponse(userMsg.text);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'malin',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';
    return (
      <View
        style={[
          styles.messageBubble,
          {
            alignSelf: isUser ? 'flex-end' : 'flex-start',
            backgroundColor: isUser ? theme.colors.primary : theme.colors.surface,
            borderBottomRightRadius: isUser ? 0 : 20,
            borderBottomLeftRadius: isUser ? 20 : 0,
          },
        ]}
      >
        <Text style={{ color: theme.colors.text }}>{item.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.elevation.level2 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
            <Icon name="robot" size={24} color={theme.colors.primary} style={{marginRight: 8}} />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Malin AI</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {isTyping && (
        <View style={{ padding: 10, marginLeft: 20 }}>
          <Text style={{ color: theme.colors.secondary, fontStyle: 'italic' }}>Malin écrit...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}
      >
        <TextInput
          style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.background }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Pose une question..."
          placeholderTextColor={theme.colors.secondary}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity onPress={sendMessage} style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}>
          <Icon name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
