
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { sendPushNotification } from "../utils/sendPushNotification";

export default function GoLiveScreen({ route }) {
  const { engagementId, weddingType = "traditional" } = route.params || {};
  const [isLive, setIsLive] = useState(false);
  const [streamId, setStreamId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [viewers, setViewers] = useState(0);
  const [reactions, setReactions] = useState({});
  const [showWeddingTypes, setShowWeddingTypes] = useState(false);
  const [selectedWeddingType, setSelectedWeddingType] = useState(weddingType);
  const currentUser = auth.currentUser;

  const weddingTypes = [
    { id: "traditional", name: "Traditional Wedding", emoji: "👰🤵" },
    { id: "white", name: "White Wedding", emoji: "💒" },
    { id: "court", name: "Court Wedding", emoji: "⚖️" },
  ];

  useEffect(() => {
    if (streamId) {
      // Listen to live comments
      const commentsRef = collection(db, "liveStreams", streamId, "comments");
      const q = query(commentsRef, orderBy("createdAt", "desc"));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commentsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(commentsList);
      });

      // Listen to viewer count
      const streamRef = doc(db, "liveStreams", streamId);
      const streamUnsubscribe = onSnapshot(streamRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setViewers(data.viewerCount || 0);
          setReactions(data.reactions || {});
        }
      });

      return () => {
        unsubscribe();
        streamUnsubscribe();
      };
    }
  }, [streamId]);

  const startLiveStream = async () => {
    try {
      const streamData = {
        hostId: currentUser.uid,
        engagementId: engagementId,
        weddingType: selectedWeddingType,
        title: `${getWeddingTypeData().name} - Live Now!`,
        isActive: true,
        viewerCount: 0,
        reactions: {},
        createdAt: serverTimestamp(),
      };

      const streamRef = await addDoc(collection(db, "liveStreams"), streamData);
      setStreamId(streamRef.id);
      setIsLive(true);

      // Notify followers/guardians
      await notifyFollowers(streamRef.id);

      Alert.alert("🎉 Live!", "Your wedding is now streaming live!");
    } catch (error) {
      Alert.alert("Error", "Failed to start live stream");
    }
  };

  const endLiveStream = async () => {
    try {
      if (streamId) {
        await updateDoc(doc(db, "liveStreams", streamId), {
          isActive: false,
          endedAt: serverTimestamp(),
        });
        setIsLive(false);
        setStreamId(null);
        Alert.alert("Stream Ended", "Your live stream has ended.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to end stream");
    }
  };

  const addComment = async () => {
    if (newComment.trim() === "" || !streamId) return;

    try {
      await addDoc(collection(db, "liveStreams", streamId, "comments"), {
        text: newComment,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
      });
      setNewComment("");
    } catch (error) {
      Alert.alert("Error", "Failed to add comment");
    }
  };

  const addReaction = async (emoji) => {
    if (!streamId) return;

    try {
      const streamRef = doc(db, "liveStreams", streamId);
      const currentCount = reactions[emoji] || 0;
      
      await updateDoc(streamRef, {
        [`reactions.${emoji}`]: currentCount + 1,
      });
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const notifyFollowers = async (streamId) => {
    try {
      // Get all users to notify them of the live wedding
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = usersSnapshot.docs.map(doc => doc.data());

      // Send notifications to users with push tokens
      const notifications = users
        .filter(user => user.expoPushToken && user.uid !== currentUser.uid)
        .map(user => 
          sendPushNotification(
            user.expoPushToken,
            "🎉 Wedding Live Now!",
            `${getWeddingTypeData().name} is happening live! Join the celebration!`
          )
        );

      await Promise.all(notifications);
    } catch (error) {
      console.error("Error notifying followers:", error);
    }
  };

  const getWeddingTypeData = () => {
    return weddingTypes.find(type => type.id === selectedWeddingType) || weddingTypes[0];
  };

  const renderComment = ({ item }) => (
    <View style={styles.comment}>
      <Text style={styles.commentUser}>{item.userName}:</Text>
      <Text style={styles.commentText}>{item.text}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📹 Go Live</Text>

      {!isLive ? (
        <View style={styles.setupSection}>
          <Text style={styles.sectionTitle}>Wedding Type</Text>
          <TouchableOpacity
            style={styles.weddingTypeSelector}
            onPress={() => setShowWeddingTypes(true)}
          >
            <Text style={styles.weddingTypeText}>
              {getWeddingTypeData().emoji} {getWeddingTypeData().name}
            </Text>
          </TouchableOpacity>

          <Button
            title="🎥 Start Live Stream"
            onPress={startLiveStream}
            color="#FF6B6B"
          />
        </View>
      ) : (
        <View style={styles.liveSection}>
          <View style={styles.liveHeader}>
            <Text style={styles.liveIndicator}>🔴 LIVE</Text>
            <Text style={styles.viewerCount}>👥 {viewers} viewers</Text>
          </View>

          <Text style={styles.streamTitle}>
            {getWeddingTypeData().emoji} {getWeddingTypeData().name}
          </Text>

          {/* Reactions */}
          <View style={styles.reactionsSection}>
            <Text style={styles.sectionTitle}>Quick Reactions</Text>
            <View style={styles.reactionButtons}>
              {["❤️", "🎉", "👏", "😍", "🥳", "💐"].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionButton}
                  onPress={() => addReaction(emoji)}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text style={styles.reactionCount}>
                    {reactions[emoji] || 0}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Comments */}
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>Live Comments</Text>
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              style={styles.commentsList}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.commentInput}>
              <TextInput
                style={styles.textInput}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment..."
                multiline
              />
              <TouchableOpacity style={styles.sendButton} onPress={addComment}>
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="⏹️ End Stream"
            onPress={endLiveStream}
            color="#666"
          />
        </View>
      )}

      {/* Wedding Type Selection Modal */}
      <Modal
        visible={showWeddingTypes}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWeddingTypes(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Wedding Type</Text>
            {weddingTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.weddingTypeOption,
                  selectedWeddingType === type.id && styles.selectedType,
                ]}
                onPress={() => {
                  setSelectedWeddingType(type.id);
                  setShowWeddingTypes(false);
                }}
              >
                <Text style={styles.weddingTypeOptionText}>
                  {type.emoji} {type.name}
                </Text>
              </TouchableOpacity>
            ))}
            <Button
              title="Cancel"
              onPress={() => setShowWeddingTypes(false)}
              color="#666"
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 24,
  },
  setupSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  weddingTypeSelector: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  weddingTypeText: {
    fontSize: 16,
    textAlign: "center",
  },
  liveSection: {
    marginBottom: 24,
  },
  liveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  liveIndicator: {
    backgroundColor: "#FF0000",
    color: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontWeight: "bold",
  },
  viewerCount: {
    fontSize: 16,
    color: "#666",
  },
  streamTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  reactionsSection: {
    marginBottom: 20,
  },
  reactionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  reactionButton: {
    alignItems: "center",
    margin: 8,
  },
  reactionEmoji: {
    fontSize: 24,
  },
  reactionCount: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  commentsSection: {
    marginBottom: 20,
  },
  commentsList: {
    maxHeight: 200,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  comment: {
    marginBottom: 8,
  },
  commentUser: {
    fontWeight: "bold",
    color: "#6A0DAD",
  },
  commentText: {
    color: "#333",
    marginTop: 2,
  },
  commentInput: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    backgroundColor: "#FFFFFF",
  },
  sendButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  weddingTypeOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedType: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  weddingTypeOptionText: {
    fontSize: 16,
    textAlign: "center",
  },
});
