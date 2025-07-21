// src/services/SoundService.ts - Simplified version that handles library issues
import { Platform } from 'react-native';

// Try to import Sound, but handle if it fails
let Sound: any = null;
let soundAvailable = false;

try {
  Sound = require('react-native-sound').default || require('react-native-sound');
  if (Sound && typeof Sound.setCategory === 'function') {
    Sound.setCategory('Playback');
    soundAvailable = true;
  }
} catch (error: any) {
  console.warn('react-native-sound not available, sounds will be disabled:', error?.message || error);
  soundAvailable = false;
}

type SoundKey = 'buttonPress' | 'correct' | 'incorrect' | 'streak' | 'gameMusic' | 'menuMusic';

class SoundService {
  private sounds: Map<SoundKey, any> = new Map();
  private musicInstance: any = null;
  private isMusicEnabled: boolean = true;
  private isSoundEnabled: boolean = true;
  private isInitialized: boolean = false;
  
  // Fallback sound file names for native bundle
  private readonly soundFileNames: Record<SoundKey, string> = {
    buttonPress: 'buttonpress',
    correct: 'correct',
    incorrect: 'incorrect',
    streak: 'streak',
    gameMusic: 'gamemusic',
    menuMusic: 'menumusic',
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('Initializing SoundService...');
    
    if (!soundAvailable || !Sound) {
      console.warn('Sound library not available, sounds will be disabled');
      this.isInitialized = true;
      return;
    }
    
    try {
      // Try to load sounds from native bundle (works better on Android)
      const loadPromises = Object.entries(this.soundFileNames).map(([key, filename]) => 
        this.loadSound(key as SoundKey, filename).catch(() => {
          // Ignore individual sound loading errors
          console.warn(`Failed to load sound: ${key}`);
        })
      );
      
      await Promise.all(loadPromises);
      this.isInitialized = true;
      console.log('SoundService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize sounds:', error);
      this.isInitialized = true;
    }
  }

  private loadSound(key: SoundKey, filename: string): Promise<void> {
    return new Promise((resolve) => {
      if (!Sound || !soundAvailable) {
        console.warn(`Sound library not available, ${key} will be disabled`);
        resolve();
        return;
      }

      try {
        // Try loading from native bundle first (works better on Android)
        const sound = new Sound(filename, Sound.MAIN_BUNDLE, (error: any) => {
          if (error) {
            console.warn(`Failed to load sound ${filename} from native bundle:`, error.message);
            // Don't reject, just resolve without the sound
            resolve();
          } else {
            this.sounds.set(key, sound);
            console.log(`Successfully loaded sound: ${key}`);
            resolve();
          }
        });
      } catch (error) {
        console.warn(`Error creating sound ${key}:`, error);
        resolve(); // Don't fail initialization
      }
    });
  }

  private playSound(key: SoundKey, options?: { volume?: number }): void {
    if (!this.isSoundEnabled || !soundAvailable) return;
    
    const sound = this.sounds.get(key);
    if (!sound) {
      console.warn(`Sound ${key} not loaded or not available`);
      return;
    }
    
    try {
      // Reset to beginning and set volume
      if (sound.setCurrentTime) {
        sound.setCurrentTime(0);
      }
      
      if (options?.volume !== undefined && sound.setVolume) {
        sound.setVolume(options.volume);
      }
      
      // Play the sound
      sound.play((success: boolean) => {
        if (!success) {
          console.warn(`Failed to play sound: ${key}`);
        }
      });
    } catch (error) {
      console.warn(`Error playing sound ${key}:`, error);
    }
  }

  // Public methods
  playButtonPress(): void {
    this.playSound('buttonPress', { volume: 0.5 });
  }

  playCorrect(): void {
    this.playSound('correct', { volume: 0.7 });
  }

  playIncorrect(): void {
    this.playSound('incorrect', { volume: 0.6 });
  }

  playStreak(): void {
    this.playSound('streak', { volume: 0.8 });
  }

  startMenuMusic(): void {
    if (!this.isMusicEnabled || !soundAvailable) return;
    this.stopMusic();
    
    const music = this.sounds.get('menuMusic');
    if (!music) {
      console.warn('Menu music not available');
      return;
    }
    
    try {
      if (music.setNumberOfLoops) {
        music.setNumberOfLoops(-1);
      }
      if (music.setVolume) {
        music.setVolume(0.3);
      }
      if (music.setCurrentTime) {
        music.setCurrentTime(0);
      }
      
      music.play((success: boolean) => {
        if (success) {
          this.musicInstance = music;
        } else {
          console.warn('Failed to play menu music');
        }
      });
    } catch (error) {
      console.warn('Error starting menu music:', error);
    }
  }

  startGameMusic(): void {
    if (!this.isMusicEnabled || !soundAvailable) return;
    this.stopMusic();
    
    const music = this.sounds.get('gameMusic');
    if (!music) {
      console.warn('Game music not available');
      return;
    }
    
    try {
      if (music.setNumberOfLoops) {
        music.setNumberOfLoops(-1);
      }
      if (music.setVolume) {
        music.setVolume(0.3);
      }
      if (music.setCurrentTime) {
        music.setCurrentTime(0);
      }
      
      music.play((success: boolean) => {
        if (success) {
          this.musicInstance = music;
        } else {
          console.warn('Failed to play game music');
        }
      });
    } catch (error) {
      console.warn('Error starting game music:', error);
    }
  }

  stopMusic(): void {
    if (this.musicInstance && soundAvailable) {
      try {
        this.musicInstance.stop();
      } catch (error) {
        console.warn('Error stopping music:', error);
      }
      this.musicInstance = null;
    }
  }

  pauseMusic(): void {
    if (this.musicInstance && soundAvailable) {
      try {
        if (this.musicInstance.pause) {
          this.musicInstance.pause();
        }
      } catch (error) {
        console.warn('Error pausing music:', error);
      }
    }
  }

  resumeMusic(): void {
    if (this.musicInstance && this.isMusicEnabled && soundAvailable) {
      try {
        this.musicInstance.play();
      } catch (error) {
        console.warn('Error resuming music:', error);
      }
    }
  }

  setMusicEnabled(enabled: boolean): void {
    this.isMusicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }

  setSoundEnabled(enabled: boolean): void {
    this.isSoundEnabled = enabled;
  }

  getMusicEnabled(): boolean {
    return this.isMusicEnabled;
  }

  getSoundEnabled(): boolean {
    return this.isSoundEnabled;
  }

  release(): void {
    this.stopMusic();
    if (soundAvailable) {
      this.sounds.forEach(sound => {
        try {
          if (sound && sound.release) {
            sound.release();
          }
        } catch (error) {
          console.warn('Error releasing sound:', error);
        }
      });
    }
    this.sounds.clear();
    this.isInitialized = false;
  }
}

export default new SoundService();