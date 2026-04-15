import React from "react";
import { View } from "react-native";
import Svg, { Path, Polygon, Circle } from "react-native-svg";

interface PalavaStarProps {
  size?: number;
}

export function PalavaStar({ size = 18 }: PalavaStarProps) {
  return (
    <View style={{ width: size, height: size, marginLeft: 4 }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {/* Shield / Liberian-inspired seal shape */}
        <Path
          d="M12 2L4 5.5V12c0 4.8 3.5 9.1 8 10.5C16.5 21.1 20 16.8 20 12V5.5L12 2z"
          fill="#BF0A30"
        />
        {/* Gold outer ring dot accents */}
        <Circle cx="12" cy="3.5" r="1" fill="#D4A855" />
        {/* Five-pointed star (Liberia's lone star) in gold */}
        <Polygon
          points="12,7 13.1,10.3 16.5,10.3 13.9,12.3 14.9,15.5 12,13.5 9.1,15.5 10.1,12.3 7.5,10.3 10.9,10.3"
          fill="#D4A855"
        />
      </Svg>
    </View>
  );
}
