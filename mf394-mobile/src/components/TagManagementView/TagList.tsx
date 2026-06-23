/**
 * TagList Component
 *
 * Presentational component: scrollable grid of tag pills with
 * long-press and double-click delete interactions.
 * No Redux access — all state and callbacks come from props.
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/theme';

export interface TagListProps {
  tags: string[];
  onDeleteTag: (tag: string) => void;
}

export function TagList({ tags, onDeleteTag }: TagListProps) {
  const animationRefs = useRef<Record<string, Animated.Value>>({});
  const lastTapTimeRef = useRef<Record<string, number>>({});

  const getAnimationValue = (tag: string): Animated.Value => {
    if (!animationRefs.current[tag]) {
      animationRefs.current[tag] = new Animated.Value(1);
    }
    return animationRefs.current[tag];
  };

  const handlePillLongPress = (tag: string) => {
    onDeleteTag(tag);
  };

  const handlePillPress = (tag: string) => {
    const now = Date.now();
    const lastTap = lastTapTimeRef.current[tag] || 0;

    if (now - lastTap < 300) {
      onDeleteTag(tag);
      lastTapTimeRef.current[tag] = 0;
    } else {
      lastTapTimeRef.current[tag] = now;
    }
  };

  const handlePressIn = (tag: string) => {
    const animValue = getAnimationValue(tag);
    Animated.timing(animValue, {
      toValue: 0.7,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (tag: string) => {
    const animValue = getAnimationValue(tag);
    Animated.timing(animValue, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  if (tags.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome name="tags" size={32} color={colors.semantic.textTertiary} />
        <Text style={styles.emptyText}>No tags yet</Text>
        <Text style={styles.emptySubtext}>Add your first tag above</Text>
      </View>
    );
  }

  return (
    <View style={styles.pillGrid}>
      {tags.map((tag) => {
        const animValue = getAnimationValue(tag);
        return (
          <Animated.View
            key={tag}
            style={[
              {
                opacity: animValue,
                transform: [
                  {
                    scale: animValue.interpolate({
                      inputRange: [0.7, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable
              style={styles.pill}
              onPress={() => handlePillPress(tag)}
              onLongPress={() => handlePillLongPress(tag)}
              onPressIn={() => handlePressIn(tag)}
              onPressOut={() => handlePressOut(tag)}
              delayLongPress={500}
              testID={`tag-pill-${tag}`}
            >
              <Text style={styles.pillText}>{tag}</Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.body.large.fontSize,
    fontWeight: '600',
    color: colors.semantic.textSecondary,
  },
  emptySubtext: {
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.textTertiary,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.primary[500],
    backgroundColor: colors.semantic.surface,
  },
  pillText: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: '600',
    color: colors.primary[500],
  },
});
