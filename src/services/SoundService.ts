import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

Sound.setCategory('Playback');

interface SoundEffects {
  correct: Sound | null;
  incorrect: Sound | null;
  buttonpress: Sound | null;
  gamemusic: Sound | null;
  menumusic: Sound | null;
  streak: Sound | null;
}

class SoundServiceClass {
  private sounds: SoundEffects = {
    correct: null,
    incorrect: null,
    buttonpress: null,
    gamemusic: null,
    menumusic: null,
    streak: null,
  };

  private isMuted = false;
  private musicVolume = 0.3;
  private effectsVolume = 0.6;
  private SETTINGS_KEY = '@BrainBites:soundSettings';

  async initialize() {
    // Load sound settings
    await this.loadSettings();

    // Pre-load all sound files - handle missing files gracefully
    const soundFiles = {
      correct: 'correct.mp3',
      incorrect: 'incorrect.mp3',
      buttonpress: 'buttonpress.mp3',
      gamemusic: 'gamemusic.mp3',
      menumusic: 'menumusic.mp3',
      streak: 'streak.mp3',
    };

    Object.entries(soundFiles).forEach(([key, filename]) => {
      this.sounds[key as keyof SoundEffects] = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log(`Sound file ${filename} not found - app will work without this sound`);
          // Set to null so the app continues to work
          this.sounds[key as keyof SoundEffects] = null;
        } else {
          console.log(`Successfully loaded ${filename}`);
          // Set properties for background music
          if ((key === 'gamemusic' || key === 'menumusic') && this.sounds[key as keyof SoundEffects]) {
            this.sounds[key as keyof SoundEffects]!.setNumberOfLoops(-1); // Loop infinitely
            this.sounds[key as keyof SoundEffects]!.setVolume(this.musicVolume);
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
      sound.setVolume(soundName === 'gamemusic' || soundName === 'menumusic' ? this.musicVolume : this.effectsVolume);
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
    this.playSound('buttonpress');
  }

  playStreak() {
    this.playSound('streak');
  }

  playGameMusic() {
    if (!this.isMuted && this.sounds.gamemusic) {
      this.sounds.gamemusic.play();
    }
  }

  playMenuMusic() {
    if (!this.isMuted && this.sounds.menumusic) {
      this.sounds.menumusic.play();
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
      // Don't auto-resume music when unmuting - let the app decide when to play
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
    this.effectsVolume = Math.max(0, Math.min(1, volume));
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