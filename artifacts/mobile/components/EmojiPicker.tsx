import React, { useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const CATEGORIES: { label: string; icon: string; emojis: string[] }[] = [
  {
    label: "Smileys",
    icon: "😊",
    emojis: [
      "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙",
      "😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥",
      "😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","😎","🤓","🧐",
      "😕","😟","🙁","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓",
      "😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖",
    ],
  },
  {
    label: "Gestures",
    icon: "👋",
    emojis: [
      "👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍",
      "👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦿","🦵","🦶","👂",
      "🦻","👃","🧠","🫀","🫁","🦷","🦴","👀","👁️","👅","👄","💋","🩸",
    ],
  },
  {
    label: "Hearts",
    icon: "❤️",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝",
      "💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎",
    ],
  },
  {
    label: "People",
    icon: "👩",
    emojis: [
      "👶","🧒","👦","👧","🧑","👱","👨","🧔","👩","🧓","👴","👵","🧕","👲","👳","🦱","🦰","🦳","🦲",
      "👮","🕵️","💂","🥷","👷","🫅","🤴","👸","👰","🤵","🙍","🙎","🙅","🙆","💁","🙋","🧏","🙇","🤦","🤷",
      "💆","💇","🚶","🧍","🧎","🏃","🕺","💃","🤸","🏄","🚵","🤾","🏊","🤽","🧗","🚴","🏇","🤺","⛹️","🏋️",
    ],
  },
  {
    label: "Animals",
    icon: "🐶",
    emojis: [
      "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒","🐔",
      "🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷️",
      "🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🦭","🐊",
    ],
  },
  {
    label: "Food",
    icon: "🍔",
    emojis: [
      "🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑",
      "🥦","🧄","🧅","🥔","🌽","🌶️","🫑","🥒","🥬","🥗","🥙","🧆","🌮","🌯","🫔","🥪","🥨","🧀","🍳","🧈",
      "🥞","🧇","🥓","🍔","🍟","🌭","🍕","🫓","🥗","🍝","🍜","🍲","🍛","🍣","🍱","🍤","🍙","🍚","🍘","🧁",
      "🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯","☕","🫖","🍵","🧃","🥤","🧋","🍺","🥂",
    ],
  },
  {
    label: "Travel",
    icon: "✈️",
    emojis: [
      "🚗","🚕","🚙","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍️","🛵","🚲","🛴","🛺","🚁","✈️","🛫",
      "🛬","🪂","💺","🚀","🛸","🌍","🌎","🌏","🗺️","🗾","🧭","🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏗️","🏘️","🏙️",
      "🏚️","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🗼","🗽","⛪","🕌","🕍","⛩️",
    ],
  },
  {
    label: "Objects",
    icon: "💡",
    emojis: [
      "⌚","📱","💻","⌨️","🖥️","🖨️","🖱️","🖲️","💾","💿","📀","📷","📸","📹","🎥","📽️","📞","☎️","📟","📠",
      "📺","📻","🎙️","🎚️","🎛️","🧭","⏱️","⏰","⏲️","⌛","📡","🔋","🪫","🔌","💡","🔦","🕯️","💰","💴","💵",
      "💳","💎","⚖️","🦯","🔑","🗝️","🔓","🔒","🔨","⛏️","🪓","🔧","🔩","⚙️","🧱","🪤","🪣","🧲","🪜","🧰",
      "🎁","🎀","🎊","🎉","🎈","🎏","🎐","🪅","🪆","🎑","🧧","📿","💍","💄","👑","🎭","🎨","🖼️","🎪","🎬",
    ],
  },
  {
    label: "Flags",
    icon: "🏳️",
    emojis: [
      "🇱🇷","🏳️","🏴","🚩","🏁","🏴‍☠️","🏳️‍🌈","🏳️‍⚧️","🇺🇳","🇺🇸","🇬🇧","🇫🇷","🇩🇪","🇯🇵","🇨🇳","🇮🇳","🇧🇷","🇨🇦","🇦🇺","🇰🇷",
      "🇳🇬","🇬🇭","🇿🇦","🇰🇪","🇪🇹","🇸🇳","🇨🇲","🇨🇮","🇹🇿","🇺🇬","🇷🇼","🇲🇦","🇩🇿","🇪🇬","🇸🇱","🇬🇳","🇬🇲","🇲🇱","🇧🇫","🇧🇯",
    ],
  },
];

const NUM_COLS = 8;

interface Props {
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onSelect }: Props) {
  const colors = useColors();
  const [activeCategory, setActiveCategory] = useState(0);

  const emojis = CATEGORIES[activeCategory].emojis;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabs, { borderBottomColor: colors.border }]}
        contentContainerStyle={styles.tabsContent}
      >
        {CATEGORIES.map((cat, i) => (
          <TouchableOpacity
            key={cat.label}
            onPress={() => setActiveCategory(i)}
            style={[
              styles.tab,
              activeCategory === i && [styles.tabActive, { borderBottomColor: colors.primary }],
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>{cat.icon}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Emoji grid */}
      <FlatList
        data={emojis}
        keyExtractor={(item, i) => `${activeCategory}-${i}`}
        numColumns={NUM_COLS}
        key={`grid-${activeCategory}`}
        showsVerticalScrollIndicator={false}
        style={styles.grid}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.emojiCell}
            onPress={() => onSelect(item)}
            activeOpacity={0.6}
          >
            <Text style={styles.emoji}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 280,
    borderTopWidth: 1,
  },
  tabs: {
    borderBottomWidth: 1,
    flexGrow: 0,
  },
  tabsContent: {
    paddingHorizontal: 4,
    height: 44,
    alignItems: "center",
  },
  tab: {
    paddingHorizontal: 10,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabIcon: { fontSize: 20 },
  grid: { flex: 1 },
  gridContent: { paddingHorizontal: 4, paddingVertical: 6 },
  emojiCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  emoji: { fontSize: 26 },
});
