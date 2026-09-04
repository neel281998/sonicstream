import { create } from 'zustand';
import { Ionicons } from '@expo/vector-icons';

export interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface DialogOptions {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  buttons?: DialogButton[];
}

interface ConfirmOptions {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface AlertOptions {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  buttonText?: string;
  onDismiss?: () => void;
}

interface DialogState {
  isOpen: boolean;
  options: DialogOptions;
  openDialog: (options: DialogOptions) => void;
  closeDialog: () => void;
  showConfirm: (options: ConfirmOptions) => void;
  showAlert: (options: AlertOptions) => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  isOpen: false,
  options: { title: '' },

  openDialog: (options) => {
    set({ isOpen: true, options });
  },

  closeDialog: () => {
    set({ isOpen: false });
  },

  showConfirm: ({
    title,
    message,
    icon,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    destructive = false,
    onConfirm,
    onCancel,
  }) => {
    set({
      isOpen: true,
      options: {
        title,
        message,
        icon: icon || (destructive ? 'alert-circle-outline' : 'help-circle-outline'),
        buttons: [
          {
            text: cancelText,
            style: 'cancel',
            onPress: onCancel,
          },
          {
            text: confirmText,
            style: destructive ? 'destructive' : 'default',
            onPress: onConfirm,
          },
        ],
      },
    });
  },

  showAlert: ({
    title,
    message,
    icon = 'information-circle-outline',
    buttonText = 'OK',
    onDismiss,
  }) => {
    set({
      isOpen: true,
      options: {
        title,
        message,
        icon,
        buttons: [
          {
            text: buttonText,
            style: 'default',
            onPress: onDismiss,
          },
        ],
      },
    });
  },
}));

/**
 * Convenient drop-in helper functions
 */
export const showConfirm = (opts: ConfirmOptions) =>
  useDialogStore.getState().showConfirm(opts);

export const showAlert = (opts: AlertOptions) =>
  useDialogStore.getState().showAlert(opts);

export const showCustomDialog = (opts: DialogOptions) =>
  useDialogStore.getState().openDialog(opts);
