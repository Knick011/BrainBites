import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from './NotificationService';

Sound.setCategory('Playback');

interface SoundEffects {
  correct: Sound | null;
  incorrect: Sound | null;
  buttonClick: Sound | null;
  streak: Sound | null;
  gamemusic: Sound | null;
  menumusic: Sound | null;
}

class SoundServiceClass {
  private sounds: SoundEffects = {
    correct: null,
    incorrect: null,
    buttonClick: null,
    streak: null,
    gamemusic: null,
    menumusic: null,
  };

  private isMuted = false;
  private musicVolume = 0.3;
  private effectsVolume = 0.6;
  private SETTINGS_KEY = '@BrainBites:soundSettings';
  private soundEnabled = true;
  private currentMusic: Sound | null = null;

  async initialize() {
    try {
      // Load sound settings
      await this.loadSettings();

      console.log('🔊 Initializing SoundService...');

      // Pre-load all sound files from assets folder
      const soundFiles = {
        correct: 'correct.mp3',
        incorrect: 'incorrect.mp3',
        buttonClick: 'buttonpress.mp3',
        streak: 'streak.mp3',
        gamemusic: 'gamemusic.mp3',
        menumusic: 'menumusic.mp3',
      };

      // Load sounds with better error handling
      for (const [key, filename] of Object.entries(soundFiles)) {
        try {
          console.log(`🔊 Loading sound: ${key} (${filename})`);
          
          this.sounds[key as keyof SoundEffects] = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
            if (error) {
              console.log(`⚠️ Sound file ${key} not found - app will work without this sound`);
              console.log(`Error details:`, error);
              // Set to null so the app continues to work
              this.sounds[key as keyof SoundEffects] = null;
            } else {
              console.log(`✅ Successfully loaded ${key}`);
              // Set properties for background music
              if ((key === 'gamemusic' || key === 'menumusic') && this.sounds[key as keyof SoundEffects]) {
                this.sounds[key as keyof SoundEffects]?.setNumberOfLoops(-1); // Loop infinitely
                this.sounds[key as keyof SoundEffects]?.setVolume(this.musicVolume);
              }
            }
          });
        } catch (error) {
          console.log(`❌ Failed to initialize sound ${key}:`, error);
          this.sounds[key as keyof SoundEffects] = null;
        }
      }

      console.log('✅ SoundService initialization completed');
    } catch (error) {
      console.log('❌ SoundService initialization failed, continuing without sound:', error);
      // Don't throw the error, just log it and continue
      // This prevents the app from crashing if sound initialization fails
    }
  }

  private async loadSettings() {
    try {
      const settings = await AsyncStorage.getItem(this.SETTINGS_KEY);
      if (settings) {
        const parsed = JSON.parse(settings);
        this.soundEnabled = parsed.soundEnabled !== undefined ? parsed.soundEnabled : true;
        this.musicVolume = parsed.musicVolume || 0.3;
        this.effectsVolume = parsed.effectsVolume || 0.6;
      }
    } catch (error) {
      console.error('Failed to load sound settings:', error);
    }
  }

  private async saveSettings() {
    try {
      await AsyncStorage.setItem(
        this.SETTINGS_KEY,
        JSON.stringify({
          soundEnabled: this.soundEnabled,
          musicVolume: this.musicVolume,
          effectsVolume: this.effectsVolume,
        })
      );
    } catch (error) {
      console.error('Failed to save sound settings:', error);
    }
  }

  playSound(soundName: keyof SoundEffects, callback?: () => void) {
    if (!this.soundEnabled) {
      callback?.();
      return;
    }

    const sound = this.sounds[soundName];
    if (sound) {
      sound.setVolume((soundName === 'gamemusic' || soundName === 'menumusic') ? this.musicVolume : this.effectsVolume);
      sound.play((success) => {
        if (!success) {
          console.log(`Failed to play ${soundName} sound`);
        }
        callback?.();
      });
    } else {
      callback?.();
    }
  }

  // Specific sound methods for easier use
  playCorrect() {
    this.playSound('correct');
    // You can add a small delay and trigger achievement notifications here if needed
  }

  playIncorrect() {
    this.playSound('incorrect');
  }

  playButtonClick() {
    this.playSound('buttonClick');
  }

  playStreak() {
    if (this.soundEnabled && this.sounds.streak) {
      this.sounds.streak.setVolume(this.effectsVolume);
      this.sounds.streak.play();
    }
    // This method is called when streaks are achieved
  }

  playTimerWarning() {
    if (this.soundEnabled && this.sounds.buttonClick) {
      this.sounds.buttonClick.setVolume(this.effectsVolume);
      this.sounds.buttonClick.play();
    }
  }

  playGameMusic() {
    if (this.soundEnabled && this.sounds.gamemusic) {
      this.stopAllMusic();
      this.currentMusic = this.sounds.gamemusic;
      this.currentMusic.setVolume(this.musicVolume);
      this.currentMusic.play();
    }
  }

  playMenuMusic() {
    if (this.soundEnabled && this.sounds.menumusic) {
      this.stopAllMusic();
      this.currentMusic = this.sounds.menumusic;
      this.currentMusic.setVolume(this.musicVolume);
      this.currentMusic.play();
    }
  }

  stopAllMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }

  stopGameMusic() {
    this.sounds.gamemusic?.stop();
  }

  stopMenuMusic() {
    this.sounds.menumusic?.stop();
  }

  pauseGameMusic() {
    this.sounds.gamemusic?.pause();
  }

  pauseMenuMusic() {
    this.sounds.menumusic?.pause();
  }

  resumeGameMusic() {
    if (this.soundEnabled) {
      this.sounds.gamemusic?.play();
    }
  }

  resumeMenuMusic() {
    if (this.soundEnabled) {
      this.sounds.menumusic?.play();
    }
  }

  toggleMute() {
    this.soundEnabled = !this.soundEnabled;
    if (!this.soundEnabled) {
      this.stopGameMusic();
      this.stopMenuMusic();
    } else {
      this.playMenuMusic();
    }
    this.saveSettings();
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.sounds.gamemusic?.setVolume(this.musicVolume);
    this.sounds.menumusic?.setVolume(this.musicVolume);
    this.saveSettings();
  }

  setEffectsVolume(volume: number) {
    this.effectsVolume = volume;
    this.saveSettings();
  }

  isSoundEnabled() {
    return this.soundEnabled;
  }

  getMusicVolume() {
    return this.musicVolume;
  }

  getEffectsVolume() {
    return this.effectsVolume;
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.stopAllMusic();
    }
    this.saveSettings();
  }

  stopAll() {
    Object.values(this.sounds).forEach((sound) => {
      sound?.stop();
      sound?.release();
    });
  }

  getMuteStatus() {
    return this.isMuted;
  }

  getVolumes() {
    return {
      music: this.musicVolume,
      effects: this.effectsVolume,
    };
  }
}

export const SoundService = new SoundServiceClass();