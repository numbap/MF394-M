import React from 'react';
import { Text } from 'react-native';

// Mock FontAwesome icon component for testing
const MockIcon = ({ name, size, color, style, ...props }) => (
  <Text style={style} {...props}>
    {name}
  </Text>
);

export const FontAwesome = MockIcon;
export const MaterialIcons = MockIcon;
export const Ionicons = MockIcon;
export const Feather = MockIcon;
export const AntDesign = MockIcon;

export default {
  FontAwesome: MockIcon,
  MaterialIcons: MockIcon,
  Ionicons: MockIcon,
  Feather: MockIcon,
  AntDesign: MockIcon,
};
