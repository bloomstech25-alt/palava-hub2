import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import {
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Props {
  visible: boolean;
  callId: string;
  name: string;
  avatar: string;
  school: string;
  onEnd: () => void;
}

const IS_WEB = Platform.OS === "web";

function buildDailyUrl(roomUrl: string, displayName: string): string {
  const params = new URLSearchParams({
    startVideoOff: "true",
    startAudioOff: "false",
    userName: displayName,
  });
  const sep = roomUrl.includes("?") ? "&" : "?";
  return `${roomUrl}${sep}${params.toString()}`;
}

export default function VoiceCallModal({ visible, callId, name, avatar, school, onEnd }: Props) {
  const insets = useSafeAreaInsets();
  const [roomUrl, setRoomUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!visible) return;

    setRoomUrl("");
    setError("");

    if (callId) {
      unsubRef.current = onSnapshot(
        doc(db, "calls", callId),
        (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          if (data.roomUrl && !roomUrl) {
            setRoomUrl(String(data.roomUrl));
          }
          if (data.errorMessage) {
            setError(String(data.errorMessage));
          }
          if (data.status === "ended" || data.status === "declined") {
            cleanup();
            setTimeout(onEnd, 800);
          }
        },
        () => { setError("Cannot connect. Check your internet."); },
      );
    }

    return () => { cleanup(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, callId]);

  const cleanup = () => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
  };

  const handleEnd = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (callId) {
      try { await updateDoc(doc(db, "calls", callId), { status: "ended", endedAt: serverTimestamp() }); } catch { /* ignore */ }
    }
    cleanup();
    onEnd();
  };

  const fullUrl = roomUrl ? buildDailyUrl(roomUrl, name || "Caller") : "";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Daily room webview / iframe */}
        {fullUrl ? (
          IS_WEB ? (
            <View style={styles.webviewWrap}>
              {/* @ts-ignore - iframe is fine on web */}
              <iframe
                src={fullUrl}
                style={{ border: 0, width: "100%", height: "100%" }}
                allow="camera; microphone; autoplay; display-capture; fullscreen"
              />
            </View>
          ) : (
            <WebView
              source={{ uri: fullUrl }}
              style={styles.webview}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              mediaCapturePermissionGrantType="grant"
              originWhitelist={["*"]}
              allowsBackForwardNavigationGestures={false}
            />
          )
        ) : (
          <View style={styles.loading}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.school}>{school}</Text>
            {error ? (
              <>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.errorBtn} onPress={handleEnd} activeOpacity={0.85}>
                  <Text style={styles.errorBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.connectingRow}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.connecting}>Connecting voice call...</Text>
              </View>
            )}
          </View>
        )}

        {/* End-call overlay button (always available even while WebView loads) */}
        <View style={[styles.endBar, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
          <TouchableOpacity style={styles.endBtn} onPress={handleEnd} activeOpacity={0.85}>
            <Feather name="phone-off" size={26} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  webview: { flex: 1, backgroundColor: "#000" },
  webviewWrap: { flex: 1, backgroundColor: "#000" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a", gap: 12, padding: 32 },
  avatar: { width: 110, height: 110, borderRadius: 55, marginBottom: 8 },
  name: { color: "#fff", fontSize: 24, fontWeight: "700" },
  school: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  connectingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24 },
  connecting: { color: "rgba(255,255,255,0.85)", fontSize: 14 },
  errorText: { color: "#fca5a5", fontSize: 14, textAlign: "center", marginTop: 24, lineHeight: 20 },
  errorBtn: { marginTop: 18, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.12)" },
  errorBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  endBar: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center", paddingTop: 12 },
  endBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
});
