import React, { forwardRef, useCallback } from "react";
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type View,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

type AnimatedPressableProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
  hoverScale?: number;
};

export const AnimatedPressable = forwardRef<View, AnimatedPressableProps>(
  (
    {
      children,
      disabled,
      onBlur,
      onFocus,
      onHoverIn,
      onHoverOut,
      onPressIn,
      onPressOut,
      pressedScale = 0.98,
      hoverScale = 1.01,
      style,
      ...props
    },
    ref,
  ) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(disabled ? 0.55 : 1);

    const settle = useCallback(() => {
      scale.value = withTiming(1, { duration: 140 });
      opacity.value = withTiming(disabled ? 0.55 : 1, { duration: 140 });
    }, [disabled, opacity, scale]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedPressableBase
        ref={ref}
        disabled={disabled}
        style={[style, animatedStyle]}
        onPressIn={(event) => {
          scale.value = withTiming(pressedScale, { duration: 90 });
          opacity.value = withTiming(disabled ? 0.55 : 0.86, { duration: 90 });
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          settle();
          onPressOut?.(event);
        }}
        onHoverIn={(event) => {
          if (!disabled) {
            scale.value = withTiming(hoverScale, { duration: 140 });
          }
          onHoverIn?.(event);
        }}
        onHoverOut={(event) => {
          settle();
          onHoverOut?.(event);
        }}
        onFocus={(event) => {
          if (!disabled) {
            scale.value = withTiming(hoverScale, { duration: 140 });
          }
          onFocus?.(event);
        }}
        onBlur={(event) => {
          settle();
          onBlur?.(event);
        }}
        {...props}
      >
        {children}
      </AnimatedPressableBase>
    );
  },
);

AnimatedPressable.displayName = "AnimatedPressable";
