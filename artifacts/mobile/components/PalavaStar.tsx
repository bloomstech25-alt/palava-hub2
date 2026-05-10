import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

interface PalavaStarProps {
  size?: number;
}

// Twitter-style scalloped verification badge.
// Deep gold scalloped background with a black five-pointed star (Liberia's
// lone star) in the middle — premium / official verification on Palava Hub.
export function PalavaStar({ size = 18 }: PalavaStarProps) {
  return (
    <View style={{ width: size, height: size, marginLeft: 4 }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {/* Scalloped deep-gold badge background (sunburst) */}
        <Path
          d="M12 1.5l1.85 1.55 2.36-.43.85 2.24 2.24.85-.43 2.36L20.42 10l-1.55 1.85.43 2.36-2.24.85-.85 2.24-2.36-.43L12 18.42l-1.85-1.55-2.36.43-.85-2.24-2.24-.85.43-2.36L3.58 10l1.55-1.85-.43-2.36 2.24-.85.85-2.24 2.36.43z"
          fill="#B8860B"
        />
        {/* Inner highlight ring (slightly brighter deep gold) */}
        <Path
          d="M12 3.2l1.55 1.3 1.98-.36.71 1.88 1.88.71-.36 1.98L19.06 10l-1.3 1.55.36 1.98-1.88.71-.71 1.88-1.98-.36L12 17.06l-1.55-1.3-1.98.36-.71-1.88-1.88-.71.36-1.98L4.94 10l1.3-1.55-.36-1.98 1.88-.71.71-1.88 1.98.36z"
          fill="#D4A017"
        />
        {/* Five-pointed star (Liberia's lone star) in BLACK, centered on (12,10) */}
        <Path
          d="M12 5.5L13 8.6L16.3 8.6L13.6 10.5L14.6 13.6L12 11.7L9.4 13.6L10.4 10.5L7.7 8.6L11 8.6Z"
          fill="#000000"
        />
      </Svg>
    </View>
  );
}
