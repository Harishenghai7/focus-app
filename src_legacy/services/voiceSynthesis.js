class VoiceSynthesisService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voice = null;
    this.isSpeaking = false;
    this.initVoice();
  }

  initVoice() {
    if (this.synthesis.getVoices().length > 0) {
      this.selectVoice();
    } else {
      this.synthesis.addEventListener('voiceschanged', () => {
        this.selectVoice();
      });
    }
  }

  selectVoice() {
    const voices = this.synthesis.getVoices();
    
    const preferredVoices = [
      'Google UK English Female',
      'Microsoft Zira Desktop',
      'Samantha',
      'Victoria',
      'Karen'
    ];
    
    for (const preferredName of preferredVoices) {
      const voice = voices.find(v => v.name === preferredName);
      if (voice) {
        this.voice = voice;
        return;
      }
    }
    
    this.voice = voices.find(v => v.name.toLowerCase().includes('female')) || voices[0];
  }

  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (this.isSpeaking) {
        this.synthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.voice = this.voice;
      utterance.rate = options.rate || 1.1;
      utterance.pitch = options.pitch || 1.2;
      utterance.volume = options.volume || 1;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        this.isSpeaking = true;
        if (options.onStart) options.onStart();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        if (options.onEnd) options.onEnd();
        resolve();
      };

      utterance.onerror = (error) => {
        this.isSpeaking = false;
        reject(error);
      };

      this.synthesis.speak(utterance);
    });
  }

  stop() {
    this.synthesis.cancel();
    this.isSpeaking = false;
  }

  pause() {
    this.synthesis.pause();
  }

  resume() {
    this.synthesis.resume();
  }
}

export default new VoiceSynthesisService();
