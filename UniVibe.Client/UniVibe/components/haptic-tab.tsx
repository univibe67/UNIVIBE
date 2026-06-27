import * as Haptics from "expo-haptics";
import { Pressable, PressableProps } from "react-native";

export function HapticTab(props: PressableProps) {
  return (
    <Pressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === "ios") {
          // Sekmelere basıldığında hafif bir titreşim (haptic feedback) ekler.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
