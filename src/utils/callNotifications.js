/**
 * Call Notifications Utility
 * Handles ringtones, push notifications, and missed call notifications
 */

// Create a simple ringtone using Web Audio API
export const createRingtone = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const playRingtone = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 440; // A4 note
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };
    
    let intervalId = null;
    
    return {
      play: () => {
        if (intervalId) return; // Already playing
        
        playRingtone();
        intervalId = setInterval(playRingtone, 1000);
      },
      stop: () => {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };
  } catch (error) {
    return {
      play: () => {},
      stop: () => {}
    };
  }
};

// Send push notification for incoming call
export const sendCallPushNotification = async (caller, callType) => {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(`Incoming ${callType} call`, {
        body: `${caller.full_name || caller.username} is calling...`,
        icon: caller.avatar_url || '/logo192.png',
        badge: '/logo192.png',
        tag: 'incoming-call',
        requireInteraction: true,
        vibrate: [200, 100, 200],
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
    }
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return sendCallPushNotification(caller, callType);
    }
  }
};

// Play notification sound for missed call
export const playMissedCallSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 300;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
  }
};

// Show missed call notification
export const showMissedCallNotification = async (caller, callType) => {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification('Missed call', {
        body: `You missed a ${callType} call from ${caller.full_name || caller.username}`,
        icon: caller.avatar_url || '/logo192.png',
        badge: '/logo192.png',
        tag: 'missed-call',
        vibrate: [100],
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = '/calls';
        notification.close();
      };

      // Play sound
      playMissedCallSound();

      return notification;
    } catch (error) {
    }
  }
};

export default {
  createRingtone,
  sendCallPushNotification,
  playMissedCallSound,
  showMissedCallNotification,
};
