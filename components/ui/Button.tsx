import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Radii, Spacing, FontSizes, FontWeights } from '@/constants/Theme';

type ButtonVariant = 'filled' | 'outlined' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = 'filled',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const colors = useThemeColors();

  const containerStyle: ViewStyle = {
    borderRadius: Radii.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    opacity: disabled ? 0.5 : 1,
    ...(fullWidth && { alignSelf: 'stretch' }),
    ...(variant === 'filled' && { backgroundColor: colors.primary }),
    ...(variant === 'outlined' && {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary,
    }),
    ...(variant === 'ghost' && { backgroundColor: 'transparent' }),
  };

  const labelColor =
    variant === 'filled'
      ? colors.onPrimary
      : variant === 'outlined'
      ? colors.primary
      : colors.primaryText;

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <Text
          style={[
            {
              color: labelColor,
              fontSize: FontSizes.labelLarge,
              fontWeight: FontWeights.medium,
              fontFamily: 'DMSans_500Medium',
            },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
