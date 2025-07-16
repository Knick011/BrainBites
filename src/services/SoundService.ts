import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enable playback in background/silent mode
Sound.setCategory('Playback', true);

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
      console.log('🔊 Initializing SoundService...');
      
      // Load sound settings first
      await this.loadSettings();

      // Sound file mapping - using correct paths for React Native Sound
      const soundFiles = {
        correct: 'correct.mp3',
        incorrect: 'incorrect.mp3', 
        buttonClick: 'buttonpress.mp3',
        streak: 'streak.mp3',
        gamemusic: 'gamemusic.mp3',
        menumusic: 'menumusic.mp3',
      };

      // Load each sound with proper error handling
      for (const [key, filename] of Object.entries(soundFiles)) {
        try {
          console.log(`🔊 Loading sound: ${key} (${filename})`);
          
          // Create new Sound instance with callback
          this.sounds[key as keyof SoundEffects] = new Sound(
            filename, 
            Sound.MAIN_BUNDLE, // Load from main bundle (android/app/src/main/res/raw/)
            (error) => {
              if (error) {
                console.log(`❌ Failed to load sound ${key}:`, error.message);
                this.sounds[key as keyof SoundEffects] = null;
              } else {
                console.log(`✅ Successfully loaded ${key}`);
                
                // Configure music files for looping
                if (key === 'gamemusic' || key === 'menumusic') {
                  const sound = this.sounds[key as keyof SoundEffects];
                  if (sound) {
                    sound.setNumberOfLoops(-1); // Loop infinitely
                    sound.setVolume(this.musicVolume);
                  }
                }
              }
            }
          );
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
      const volume = (soundName === 'gamemusic' || soundName === 'menumusic') 
        ? this.musicVolume 
        : this.effectsVolume;
      
      sound.setVolume(volume);
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

  // Specific sound methods
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
    this.playSound('streak');
  }

  playTimerWarning() {
    // Use button click sound for timer warning
    this.playButtonClick();
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
    // Also stop individual music tracks
    this.sounds.gamemusic?.stop();
    this.sounds.menumusic?.stop();
  }

  stopGameMusic() {
    this.sounds.gamemusic?.stop();
    if (this.currentMusic === this.sounds.gamemusic) {
      this.currentMusic = null;
    }
  }

  stopMenuMusic() {
    this.sounds.menumusic?.stop();
    if (this.currentMusic === this.sounds.menumusic) {
      this.currentMusic = null;
    }
  }

  pauseGameMusic() {
    this.sounds.gamemusic?.pause();
  }

  pauseMenuMusic() {
    this.sounds.menumusic?.pause();
  }

  resumeGameMusic() {
    if (this.soundEnabled && this.sounds.gamemusic) {
      this.sounds.gamemusic.play();
    }
  }

  resumeMenuMusic() {
    if (this.soundEnabled && this.sounds.menumusic) {
      this.sounds.menumusic.play();
    }
  }

  // Settings methods
  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.stopAllMusic();
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

  toggleMute() {
    this.soundEnabled = !this.soundEnabled;
    if (!this.soundEnabled) {
      this.stopAllMusic();
    } else {
      this.playMenuMusic();
    }
    this.saveSettings();
  }

  // Getters
  isSoundEnabled() {
    return this.soundEnabled;
  }

  getMusicVolume() {
    return this.musicVolume;
  }

  getEffectsVolume() {
    return this.effectsVolume;
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

  // Cleanup
  stopAll() {
    Object.values(this.sounds).forEach((sound) => {
      sound?.stop();
      sound?.release();
    });
    this.currentMusic = null;
  }
}

export const SoundService = new SoundServiceClass();