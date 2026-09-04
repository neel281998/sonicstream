import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing, Radii, FontSizes } from '@/constants/Theme';
import { useDialogStore, DialogButton } from '@/store/dialogStore';

const { width: SCREEN_W } = Dimensions.get('window');

export function CustomDialog() {
  const colors = useThemeColors();
  const { isOpen, options, closeDialog } = useDialogStore();

  if (!isOpen) return null;

  const { title, message, icon, iconColor, buttons = [] } = options;

  const handleButtonPress = (btn: DialogButton) => {
    closeDialog();
    if (btn.onPress) {
      // Run action on next tick so modal dismisses smoothly
      setTimeout(() => {
        btn.onPress?.();
      }, 50);
    }
  };

  const isDestructive = buttons.some((b) => b.style === 'destructive');

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={closeDialog}
    >
      <TouchableWithoutFeedback onPress={closeDialog}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.dialogCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  shadowColor: '#000000',
                },
              ]}
            >
              {/* Icon Bubble */}
              {icon && (
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: isDestructive
                        ? '#EF535018'
                        : colors.primaryContainer,
                    },
                  ]}
                >
                  <Ionicons
                    name={icon}
                    size={30}
                    color={
                      iconColor || (isDestructive ? '#E53935' : colors.primary)
                    }
                  />
                </View>
              )}

              {/* Title & Message */}
              <View style={styles.content}>
                <ThemedText
                  variant="titleMedium"
                  fontWeight="extrabold"
                  style={styles.title}
                >
                  {title}
                </ThemedText>

                {message ? (
                  <ThemedText
                    variant="bodyMedium"
                    color={colors.secondaryText}
                    style={styles.message}
                  >
                    {message}
                  </ThemedText>
                ) : null}
              </View>

              {/* Buttons */}
              <View
                style={[
                  styles.buttonRow,
                  buttons.length > 2 && styles.buttonColumn,
                ]}
              >
                {buttons.length === 0 ? (
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: colors.primary }]}
                    onPress={closeDialog}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.btnText, { color: colors.onPrimary }]}>
                      OK
                    </Text>
                  </TouchableOpacity>
                ) : (
                  buttons.map((btn, index) => {
                    const isCancel = btn.style === 'cancel';
                    const isDestruct = btn.style === 'destructive';

                    const btnBg = isDestruct
                      ? '#E53935'
                      : isCancel
                      ? colors.surfaceVariant
                      : colors.primary;

                    const textColor = isDestruct
                      ? '#FFFFFF'
                      : isCancel
                      ? colors.primaryText
                      : colors.onPrimary;

                    return (
                      <TouchableOpacity
                        key={`${btn.text}-${index}`}
                        style={[
                          styles.btn,
                          buttons.length <= 2 && { flex: 1 },
                          { backgroundColor: btnBg },
                        ]}
                        onPress={() => handleButtonPress(btn)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.btnText, { color: textColor }]}>
                          {btn.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  dialogCard: {
    width: Math.min(SCREEN_W - 48, 380),
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: Spacing.sm,
  },
  buttonColumn: {
    flexDirection: 'column',
  },
  btn: {
    height: 46,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  btnText: {
    fontSize: FontSizes.labelLarge,
    fontFamily: 'DMSans_700Bold',
  },
});
