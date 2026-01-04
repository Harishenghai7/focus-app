import { toast } from 'react-toastify';
import { playNotificationSound, getNotificationSound } from './notificationSound';

class ToastManager {
    async success(message, duration = 3000) {
        // Play notification sound for success messages
        const userSound = getNotificationSound();
        if (userSound !== 'none') {
            playNotificationSound(userSound);
        }
        return toast.success(message, { autoClose: duration });
    }

    async error(message, duration = 3000) {
        // Play notification sound for errors
        const userSound = getNotificationSound();
        if (userSound !== 'none') {
            playNotificationSound(userSound);
        }
        return toast.error(message, { autoClose: duration });
    }

    async warning(message, duration = 3000) {
        // Play notification sound for warnings
        const userSound = getNotificationSound();
        if (userSound !== 'none') {
            playNotificationSound(userSound);
        }
        return toast.warning(message, { autoClose: duration });
    }

    async info(message, duration = 3000) {
        // Play notification sound for info messages
        const userSound = getNotificationSound();
        if (userSound !== 'none') {
            playNotificationSound(userSound);
        }
        return toast.info(message, { autoClose: duration });
    }

    async show(message, type = 'info', duration = 3000) {
        // Play notification sound for custom messages
        const userSound = getNotificationSound();
        if (userSound !== 'none') {
            playNotificationSound(userSound);
        }
        return toast(message, { type, autoClose: duration });
    }

    dismiss(id) {
        toast.dismiss(id);
    }
}

export const focusToast = new ToastManager();
