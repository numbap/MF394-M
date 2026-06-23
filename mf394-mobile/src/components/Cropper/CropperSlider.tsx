import React, { useRef } from "react";
import {
  View,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
} from "react-native";
import { colors, spacing, radii, shadows } from "../../theme/theme";

export interface CropperSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step: number;
  containerWidth: number;
}

export function CropperSlider({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step,
  containerWidth,
}: CropperSliderProps) {
  const sliderWidth = containerWidth - spacing.md * 2;
  const sliderRef = useRef<View>(null);
  const sliderXRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        // Get touch position relative to slider
        if (sliderRef.current) {
          sliderRef.current.measure((_x, _y, _width, _height, pageX) => {
            sliderXRef.current = pageX;
            updateValueFromTouch(evt.nativeEvent.pageX, pageX);
          });
        }
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        updateValueFromTouch(evt.nativeEvent.pageX, sliderXRef.current);
      },
    })
  ).current;

  const updateValueFromTouch = (touchX: number, trackX: number) => {
    const position = touchX - trackX;
    const clampedPosition = Math.max(0, Math.min(sliderWidth, position));
    const percentage = clampedPosition / sliderWidth;
    const totalRange = maximumValue - minimumValue;
    const rawValue = minimumValue + percentage * totalRange;
    const snappedValue = Math.round(rawValue / step) * step;
    onValueChange(Math.max(minimumValue, Math.min(maximumValue, snappedValue)));
  };

  const progress = (value - minimumValue) / (maximumValue - minimumValue);
  const thumbPosition = progress * sliderWidth;

  return (
    <View style={styles.sliderWrapper} {...panResponder.panHandlers}>
      <View ref={sliderRef} style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: thumbPosition }]} />
        <View
          style={[
            styles.sliderThumb,
            {
              left: thumbPosition,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderWrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: colors.semantic.border,
    borderRadius: radii.full,
    justifyContent: "center",
    position: "relative",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: colors.primary[500],
    borderRadius: radii.full,
  },
  sliderThumb: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.primary[500],
    marginLeft: -14,
    top: -10,
    ...shadows.md,
  },
});
