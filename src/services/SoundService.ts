import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    // Load sound settings
    await this.loadSettings();

    // Pre-load all sound files from assets folder
    const soundFiles = {
      correct: require('../assets/sounds/correct.mp3'),
      incorrect: require('../assets/sounds/incorrect.mp3'),
      buttonClick: require('../assets/sounds/buttonpress.mp3'),
      streak: require('../assets/sounds/streak.mp3'),
      gamemusic: require('../assets/sounds/gamemusic.mp3'),
      menumusic: require('../assets/sounds/menumusic.mp3'),
    };

    Object.entries(soundFiles).forEach(([key, soundFile]) => {
      this.sounds[key as keyof SoundEffects] = new Sound(soundFile, undefined, (error) => {
        if (error) {
          console.log(`Sound file ${key} not found - app will work without this sound`);
          // Set to null so the app continues to work
          this.sounds[key as keyof SoundEffects] = null;
        } else {
          console.log(`Successfully loaded ${key}`);
          // Set properties for background music
          if ((key === 'gamemusic' || key === 'menumusic') && this.sounds[key as keyof SoundEffects]) {
            this.sounds[key as keyof SoundEffects]?.setNumberOfLoops(-1); // Loop infinitely
            this.sounds[key as keyof SoundEffects]?.setVolume(this.musicVolume);
          }
        }
      });
    });
  }

  private async loadSettings() {
    try {
      const settings = await AsyncStorage.getItem(this.SETTINGS_KEY);
      if (settings) {
        const parsed = JSON.parse(settings);
        this.isMuted = parsed.isMuted || false;
        this.musicVolume = parsed.musicVolume || 0.3;
        this.effectsVolume = parsed.effectsVolume || 0.6;
        this.soundEnabled = parsed.soundEnabled || true;
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
          isMuted: this.isMuted,
          musicVolume: this.musicVolume,
          effectsVolume: this.effectsVolume,
          soundEnabled: this.soundEnabled,
        })
      );
    } catch (error) {
      console.error('Failed to save sound settings:', error);
    }
  }

  playSound(soundName: keyof SoundEffects, callback?: () => void) {
    if (this.isMuted) {
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
    if (!this.isMuted) {
      this.sounds.gamemusic?.play();
    }
  }

  resumeMenuMusic() {
    if (!this.isMuted) {
      this.sounds.menumusic?.play();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
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