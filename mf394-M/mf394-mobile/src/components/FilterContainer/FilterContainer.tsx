/**
 * FilterContainer
 *
 * A container component that enforces max width constraint for filter interfaces.
 * Features:
 * - Maximum width of 360px
 * - Centered on larger screens
 * - Consistent experience across mobile and web
 */

import React from "react";
import { View, StyleSheet, ViewProps } from "react-native";
import { theme } from "../../theme/theme";

export interface FilterContainerProps extends ViewProps {
  children: React.ReactNode;
}

export function FilterContainer({ children, style, ...props }: FilterContainerProps) {
  return (
    <View style={[styles.container, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: theme.layout.maxFilterWidth,
    alignSelf: "center",
  },
});
