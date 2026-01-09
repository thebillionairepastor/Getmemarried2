
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { useNavigation } from "@react-navigation/native";

export default function ChatScreen({ route }) {
  const { matchId, partnerId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [partnerData, setPartnerData] = useState(null);
  const currentUser = auth.currentUser;
  const navigation = useNavigation();

  useEffect(() => {
    loadPartnerData();
    loadMessages();
  }, []);

  const loadPartnerData = async () => {
    try {
      const partnerRef = doc(db, "users", partnerId);
      const partnerSnap = await getDoc(partnerRef);
      if (partnerSnap.exists()) {
        setPartnerData(partnerSnap.data());
      }
    } catch (error) {
      console.error("Error loading partner data:", error);
    }
  };

  const loadMessages = () => {
    const messagesRef = collection(db, "matches", matchId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesList);
    });

    return unsubscribe;
  };

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    try {
      const messagesRef = collection(db, "matches", matchId, "messages");
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: currentUser.uid,
        receiverId: partnerId,
        createdAt: serverTimestamp(),
        type: "text",
      });

      // Update last activity
      await updateDoc(doc(db, "matches", matchId), {
        lastActivity: serverTimestamp(),
        lastMessage: newMessage,
      });

      setNewMessage("");
    } catch (error) {
      Alert.alert("Error", "Failed to send message");
    }
  };

  const sendEmoji = async (emoji) => {
    try {
      const messagesRef = collection(db, "matches", matchId, "messages");
      await addDoc(messagesRef, {
        text: emoji,
        senderId: currentUser.uid,
        receiverId: partnerId,
        createdAt: serverTimestamp(),
        type: "emoji",
      });

      await updateDoc(doc(db, "matches", matchId), {
        lastActivity: serverTimestamp(),
        lastMessage: emoji,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to send emoji");
    }
  };

  const goToEngagement = () => {
    navigation.navigate("EngagementScreen", { 
      partnerId, 
      matchId 
    });
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.senderId === currentUser.uid;
    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.partnerMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.partnerText,
            item.type === "emoji" && styles.emojiText,
          ]}
        >
          {item.text}
        </Text>
        <Text style={styles.timestamp}>
          {item.createdAt?.toDate()?.toLocaleTimeString() || "Sending..."}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.partnerName}>
          💬 {partnerData?.name || "Chat"}
        </Text>
        <TouchableOpacity
          style={styles.engagementButton}
          onPress={goToEngagement}
        >
          <Text style={styles.engagementButtonText}>💍</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Emoji Quick Actions */}
      <View style={styles.emojiRow}>
        {["❤️", "😊", "😍", "👍", "🙏", "🎉"].map((emoji) => (
          <TouchableOpacity
            key={emoji}
            style={styles.emojiButton}
            onPress={() => sendEmoji(emoji)}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#6A0DAD",
  },
  partnerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  engagementButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 8,
  },
  engagementButtonText: {
    fontSize: 24,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
  },
  currentUserMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#6A0DAD",
  },
  partnerMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  messageText: {
    fontSize: 16,
  },
  currentUserText: {
    color: "#FFFFFF",
  },
  partnerText: {
    color: "#333",
  },
  emojiText: {
    fontSize: 24,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  emojiButton: {
    padding: 8,
  },
  emoji: {
    fontSize: 24,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: "#6A0DAD",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
