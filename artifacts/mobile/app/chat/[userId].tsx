import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useMessaging, type Message } from "@/context/MessagingContext";
import { useColors } from "@/hooks/useColors";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateHeader(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 1000 * 60 * 60 * 24) return "Today";
  if (diff < 1000 * 60 * 60 * 48) return "Yesterday";
  return d.toLocaleDateString([], { month: "long", day: "numeric" });
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const { userId, name, username, avatar, school } = useLocalSearchParams<{
    userId: string;
    name: string;
    username: string;
    avatar: string;
    school: string;
  }>();
  const { user } = useAuth();
  const { messages, sendMessage, markRead } = useMessaging();
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const chatMessages = useMemo(() => messages[userId] ?? [], [messages, userId]);

  useEffect(() => {
    markRead(userId);
  }, [userId, markRead]);

  useEffect(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 150);
  }, [chatMessages.length]);

  const handleSend = useCallback(() => {
    if (!text.trim() || !user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(userId, name ?? "", username ?? "", avatar ?? "", school ?? "", text.trim(), user.id);
    setText("");
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 3500);
  }, [text, user, userId, name, username, avatar, school, sendMessage]);

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMe = item.fromId === "me" || item.fromId === user?.id;
    const prevMsg = index > 0 ? chatMessages[index - 1] : null;
    const showDate = !prevMsg || formatDateHeader(item.createdAt) !== formatDateHeader(prevMsg.createdAt);

    return (
      <>
        {showDate && (
          <View style={styles.dateDivider}>
            <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dateText, { color: colors.mutedForeground, backgroundColor: colors.background }]}>
              {formatDateHeader(item.createdAt)}
            </Text>
            <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
          </View>
        )}
        <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
          {!isMe && (
            <Image source={{ uri: avatar }} style={styles.msgAvatar} />
          )}
          <View style={styles.msgContent}>
            <View style={[
              styles.bubble,
              isMe
                ? [styles.bubbleMe, { backgroundColor: colors.primary }]
                : [styles.bubbleThem, { backgroundColor: colors.card, borderColor: colors.border }],
            ]}>
              <Text style={[styles.bubbleText, { color: isMe ? "#ffffff" : colors.foreground }]}>
                {item.text}
              </Text>
            </View>
            <Text style={[styles.msgTime, { color: colors.mutedForeground }, isMe && styles.msgTimeMe]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </>
    );
  }, [user, avatar, chatMessages, colors]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerUser}
          onPress={() => router.push({ pathname: "/(tabs)/profile", params: { userId } })}
          activeOpacity={0.8}
        >
          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatar }} style={styles.headerAvatar} />
            <View style={[styles.onlineDot, { backgroundColor: "#22c55e", borderColor: colors.background }]} />
          </View>
          <View>
            <Text style={[styles.headerName, { color: colors.foreground }]}>{name}</Text>
            <Text style={[styles.headerSchool, { color: colors.mutedForeground }]}>{school}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreBtn} activeOpacity={0.7}>
          <Feather name="more-horizontal" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={chatMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={[styles.msgList, { paddingBottom: bottomPad + 80 }]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <View style={[styles.emptyChatIcon, { backgroundColor: colors.accent }]}>
              <Feather name="message-circle" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyChatTitle, { color: colors.foreground }]}>Say hi to {name?.split(" ")[0]}!</Text>
            <Text style={[styles.emptyChatSub, { color: colors.mutedForeground }]}>
              You're both students on StudentConnect. Start the conversation!
            </Text>
          </View>
        }
      />

      {/* Typing indicator */}
      {isTyping && (
        <View style={[styles.typingRow, { paddingHorizontal: 16 }]}>
          <Image source={{ uri: avatar }} style={styles.typingAvatar} />
          <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.typingDots, { color: colors.mutedForeground }]}>• • •</Text>
          </View>
        </View>
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder={`Message ${name?.split(" ")[0] ?? ""}...`}
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
        </View>
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
          activeOpacity={0.8}
          disabled={!text.trim()}
        >
          <Feather name="send" size={18} color={text.trim() ? "#ffffff" : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  backBtn: { padding: 6 },
  headerUser: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  avatarWrap: { position: "relative" },
  headerAvatar: { width: 42, height: 42, borderRadius: 21 },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  headerName: { fontSize: 15, fontWeight: "700" },
  headerSchool: { fontSize: 12, marginTop: 1 },
  moreBtn: { padding: 6 },
  msgList: { paddingTop: 16, paddingHorizontal: 12 },
  dateDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 16,
  },
  dateLine: { flex: 1, height: 1 },
  dateText: { fontSize: 12, fontWeight: "600", paddingHorizontal: 8 },
  msgRow: { marginBottom: 6, maxWidth: "80%" },
  msgRowMe: { alignSelf: "flex-end", alignItems: "flex-end" },
  msgRowThem: { alignSelf: "flex-start", flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, marginBottom: 14 },
  msgContent: { gap: 3 },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: 280,
  },
  bubbleMe: {
    borderBottomRightRadius: 6,
  },
  bubbleThem: {
    borderWidth: 1,
    borderBottomLeftRadius: 6,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  msgTime: { fontSize: 11 },
  msgTimeMe: { textAlign: "right" },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 6,
  },
  typingAvatar: { width: 28, height: 28, borderRadius: 14 },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  typingDots: { fontSize: 16, letterSpacing: 2 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  input: { fontSize: 15, lineHeight: 20 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyChat: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32, gap: 14 },
  emptyChatIcon: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center" },
  emptyChatTitle: { fontSize: 18, fontWeight: "700" },
  emptyChatSub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
