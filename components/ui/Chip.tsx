import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Radii, Spacing, FontSizes, FontWeights } from '@/constants/Theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, selected = false, onPress, style }: ChipProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? colors.primary
            : 'rgba(255, 255, 255, 0.08)',
          borderColor: selected
            ? colors.primary
            : 'rgba(255, 255, 255, 0.12)',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: selected ? colors.onPrimary : colors.secondaryText,
          fontSize: FontSizes.labelMedium,
          fontWeight: FontWeights.medium,
          fontFamily: 'DMSans_500Medium',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
