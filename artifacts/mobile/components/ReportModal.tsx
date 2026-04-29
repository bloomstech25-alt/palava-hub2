import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth, type ReportInput, type ReportReason } from "@/context/AuthContext";

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  // What's being reported
  targetType: ReportInput["targetType"];
  targetId: string;
  targetUserId?: string;
  // Optional callback once a report is successfully filed (e.g. show a toast)
  onReported?: () => void;
}

const REASONS: { value: ReportReason; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: "spam", label: "Spam or scam", icon: "alert-circle" },
  { value: "harassment", label: "Harassment or bullying", icon: "user-x" },
  { value: "hate_speech", label: "Hate speech", icon: "alert-triangle" },
  { value: "nudity", label: "Nudity or sexual content", icon: "eye-off" },
  { value: "violence", label: "Violence or threats", icon: "shield-off" },
  { value: "self_harm", label: "Self-harm or suicide", icon: "heart" },
  { value: "misinformation", label: "False information", icon: "x-circle" },
  { value: "other", label: "Something else", icon: "more-horizontal" },
];

export function ReportModal({
  visible,
  onClose,
  targetType,
  targetId,
  targetUserId,
  onReported,
}: ReportModalProps) {
  const colors = useColors();
  const { reportContent } = useAuth();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setReason(null);
    setDetails("");
    setSubmitting(false);
    setSubmitted(false);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!reason) {
      setError("Please choose a reason.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await reportContent({
      targetType,
      targetId,
      targetUserId,
      reason,
      details,
    });
    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
      onReported?.();
      // Auto-close after a short success state so the user sees confirmation
      setTimeout(() => handleClose(), 1500);
    } else {
      setError(result.error ?? "Could not submit report. Please try again.");
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          testID="report-modal"
        >
          {submitted ? (
            <View style={styles.successWrap}>
              <View style={[styles.iconBubble, { backgroundColor: "#16a34a15" }]}>
                <Feather name="check" size={26} color="#16a34a" />
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>Report submitted</Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>
                Thank you. Our team typically reviews reports within 24 hours.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={[styles.iconBubble, { backgroundColor: "#DC262615" }]}>
                  <Feather name="flag" size={22} color="#DC2626" />
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn} testID="report-close">
                  <Feather name="x" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.title, { color: colors.foreground }]}>Report this content</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Tell us what's wrong. Your report is anonymous to the other user.
              </Text>

              <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
                {REASONS.map((r) => {
                  const selected = reason === r.value;
                  return (
                    <TouchableOpacity
                      key={r.value}
                      onPress={() => setReason(r.value)}
                      activeOpacity={0.7}
                      style={[
                        styles.reasonRow,
                        {
                          borderColor: selected ? colors.primary : colors.border,
                          backgroundColor: selected ? colors.primary + "12" : "transparent",
                        },
                      ]}
                      testID={`reason-${r.value}`}
                    >
                      <Feather
                        name={r.icon}
                        size={16}
                        color={selected ? colors.primary : colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.reasonLabel,
                          { color: selected ? colors.primary : colors.foreground },
                        ]}
                      >
                        {r.label}
                      </Text>
                      {selected && (
                        <Feather name="check" size={16} color={colors.primary} style={{ marginLeft: "auto" }} />
                      )}
                    </TouchableOpacity>
                  );
                })}

                <Text style={[styles.optionalLabel, { color: colors.mutedForeground }]}>
                  Additional details (optional)
                </Text>
                <TextInput
                  value={details}
                  onChangeText={setDetails}
                  placeholder="What happened?"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  maxLength={500}
                  style={[
                    styles.detailsInput,
                    {
                      color: colors.foreground,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  testID="report-details"
                />
              </ScrollView>

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={handleClose}
                  disabled={submitting}
                  style={[styles.btn, styles.btnGhost, { borderColor: colors.border }]}
                  testID="report-cancel"
                >
                  <Text style={[styles.btnGhostText, { color: colors.foreground }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting || !reason}
                  style={[
                    styles.btn,
                    styles.btnPrimary,
                    { opacity: submitting || !reason ? 0.6 : 1 },
                  ]}
                  testID="report-submit"
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>Submit report</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "90%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, fontWeight: "700", marginTop: 8 },
  subtitle: { fontSize: 13, lineHeight: 18, marginTop: 4, marginBottom: 12 },
  scroll: { maxHeight: 380 },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  reasonLabel: { fontSize: 14, fontWeight: "500" },
  optionalLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 6,
  },
  detailsInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    minHeight: 70,
    fontSize: 14,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  btnGhost: { borderWidth: 1, backgroundColor: "transparent" },
  btnGhostText: { fontSize: 14, fontWeight: "600" },
  btnPrimary: { backgroundColor: "#DC2626" },
  btnPrimaryText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  successWrap: {
    alignItems: "center",
    paddingVertical: 18,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 12,
  },
});
