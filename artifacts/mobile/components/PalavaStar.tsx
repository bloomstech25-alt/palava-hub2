import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

interface PalavaStarProps {
  size?: number;
}

// Facebook-style scalloped verification badge with a five-pointed star.
// Gold / amber colors per Palava Hub branding.
export function PalavaStar({ size = 18 }: PalavaStarProps) {
  return (
    <View style={{ width: size, height: size, marginLeft: 4 }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {/* Scalloped gold badge background (Facebook-style sunburst) */}
        <Path
          d="M12 1.5l1.85 1.55 2.36-.43.85 2.24 2.24.85-.43 2.36L20.42 10l-1.55 1.85.43 2.36-2.24.85-.85 2.24-2.36-.43L12 18.42l-1.85-1.55-2.36.43-.85-2.24-2.24-.85.43-2.36L3.58 10l1.55-1.85-.43-2.36 2.24-.85.85-2.24 2.36.43z"
          fill="#D4A53A"
        />
        {/* Inner subtle highlight ring */}
        <Path
          d="M12 3.2l1.55 1.3 1.98-.36.71 1.88 1.88.71-.36 1.98L19.06 10l-1.3 1.55.36 1.98-1.88.71-.71 1.88-1.98-.36L12 17.06l-1.55-1.3-1.98.36-.71-1.88-1.88-.71.36-1.98L4.94 10l1.3-1.55-.36-1.98 1.88-.71.71-1.88 1.98.36z"
          fill="#E8B847"
        />
        {/* Five-pointed star (Liberia's lone star) in white */}
        <Path
          d="M12 6.5l1.4 4.3h4.5l-3.65 2.65 1.4 4.3L12 15.1l-3.65 2.65 1.4-4.3L6.1 10.8h4.5z"
          fill="#FFFFFF"
        />
      </Svg>
    </View>
  );
}
