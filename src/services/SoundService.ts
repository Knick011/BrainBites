// src/services/SoundService.ts - Simplified version that handles library issues
import { Platform } from 'react-native';

// Try to import Sound, but handle if it fails
let Sound: any = null;
try {
  Sound = require('react-native-sound').default;
  // Enable playback in silence mode (iOS)
  if (Sound && typeof Sound.setCategory === 'function') {
    Sound.setCategory('Playback');
  }
} catch (error) {
  console.warn('react-native-sound not available, sounds will be disabled');
}

type SoundKey = 'buttonPress' | 'correct' | 'incorrect' | 'streak' | 'gameMusic' | 'menuMusic';

interface SoundFiles {
  buttonPress: string;
  correct: string;
  incorrect: string;
  streak: string;
  gameMusic: string;
  menuMusic: string;
}

interface PlayOptions {
  volume?: number;
}

class SoundService {
  private sounds: Record<string, any> = {};
  private musicInstance: any = null;
  private isMusicEnabled: boolean = true;
  private isSoundEnabled: boolean = true;
  private isInitialized: boolean = false;
  
  // Sound file names (without extension)
  private readonly soundFiles: SoundFiles = {
    buttonPress: 'buttonpress',
    correct: 'correct',
    incorrect: 'incorrect', 
    streak: 'streak',
    gameMusic: 'gamemusic',
    menuMusic: 'menumusic'
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('Initializing SoundService...');
    
    // If Sound library is not available, just mark as initialized
    if (!Sound) {
      console.warn('Sound library not available, skipping sound initialization');
      this.isInitialized = true;
      return;
    }
    
    try {
      // Preload all sounds
      const loadPromises = Object.entries(this.soundFiles).map(([key, filename]) => {
        return this.loadSound(key as SoundKey, filename);
      });
      
      await Promise.all(loadPromises);
      this.isInitialized = true;
      console.log('SoundService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize sounds:', error);
      // Mark as initialized even if some sounds fail to load
      this.isInitialized = true;
      console.log('SoundService initialized with some sounds unavailable');
    }
  }

  private loadSound(key: SoundKey, filename: string): Promise<any> {
    return new Promise((resolve) => {
      if (!Sound) {
        console.warn(`Sound library not available, ${key} will be unavailable`);
        resolve(null);
        return;
      }

      try {
        // Add extension based on platform
        const extension = Platform.OS === 'ios' ? '.m4a' : '.mp3';
        const fullFilename = filename + extension;
        
        console.log(`Attempting to load sound: ${fullFilename}`);
        
        // Try to load sound with error handling
        let sound: any = null;
        
        try {
          sound = new Sound(fullFilename, Sound.MAIN_BUNDLE, (error: any) => {
            if (error) {
              console.error(`Failed to load sound ${fullFilename}:`, error);
              console.warn(`Sound ${key} will be unavailable`);
              resolve(null);
              return;
            }
            
            // Store the sound instance
            this.sounds[key] = sound;
            console.log(`Successfully loaded sound: ${key}`);
            resolve(sound);
          });
        } catch (soundError) {
          console.error(`Error creating sound ${key}:`, soundError);
          console.warn(`Sound ${key} will be unavailable due to creation error`);
          resolve(null);
        }
      } catch (error) {
        console.error(`Error in loadSound for ${key}:`, error);
        console.warn(`Sound ${key} will be unavailable due to general error`);
        resolve(null);
      }
    });
  }

  private playSound(soundKey: SoundKey, options: PlayOptions = {}): void {
    if (!this.isSoundEnabled || !Sound) return;
    
    const sound = this.sounds[soundKey];
    if (!sound) {
      console.warn(`Sound not found: ${soundKey}`);
      return;
    }
    
    try {
      // Reset to beginning
      sound.setCurrentTime(0);
      
      // Set volume if specified
      if (options.volume !== undefined) {
        sound.setVolume(options.volume);
      }
      
      // Play the sound
      sound.play((success: any) => {
        if (!success) {
          console.error(`Failed to play sound: ${soundKey}`);
        }
      });
    } catch (error) {
      console.error(`Error playing sound ${soundKey}:`, error);
    }
  }

  // Public methods for specific sounds
  playButtonPress(): void {
    this.playSound('buttonPress', { volume: 0.5 });
  }

  playCorrect(): void {
    this.playSound('correct', { volume: 0.7 });
  }

  playIncorrect(): void {
    this.playSound('incorrect', { volume: 0.7 });
  }

  playStreak(): void {
    this.playSound('streak', { volume: 0.8 });
  }

  // Alias methods for backward compatibility
  playMenuMusic(): void {
    this.startMenuMusic();
  }

  playGameMusic(): void {
    this.startGameMusic();
  }

  // Additional methods for compatibility
  playButtonClick(): void {
    this.playButtonPress();
  }

  getSoundEnabled(): boolean {
    return this.isSoundEnabled;
  }

  getMusicVolume(): number {
    return 0.3; // Default volume
  }

  getEffectsVolume(): number {
    return 0.5; // Default volume
  }

  setMusicVolume(volume: number): void {
    // This would need to be implemented if you want to change music volume
    console.log('Music volume set to:', volume);
  }

  setEffectsVolume(volume: number): void {
    // This would need to be implemented if you want to change effects volume
    console.log('Effects volume set to:', volume);
  }

  // Music management
  async startGameMusic(): Promise<void> {
    if (!this.isMusicEnabled || !Sound) return;
    
    // Stop any current music
    this.stopMusic();
    
    const music = this.sounds.gameMusic;
    if (!music) {
      console.warn('Game music not loaded');
      return;
    }
    
    try {
      // Set to loop
      music.setNumberOfLoops(-1);
      music.setVolume(0.3);
      music.setCurrentTime(0);
      
      // Play
      music.play((success: any) => {
        if (success) {
          this.musicInstance = music;
        } else {
          console.error('Failed to play game music');
        }
      });
    } catch (error) {
      console.error('Error starting game music:', error);
    }
  }

  async startMenuMusic(): Promise<void> {
    if (!this.isMusicEnabled || !Sound) return;
    
    // Stop any current music
    this.stopMusic();
    
    const music = this.sounds.menuMusic;
    if (!music) {
      console.warn('Menu music not loaded');
      return;
    }
    
    try {
      // Set to loop
      music.setNumberOfLoops(-1);
      music.setVolume(0.3);
      music.setCurrentTime(0);
      
      // Play
      music.play((success: any) => {
        if (success) {
          this.musicInstance = music;
        } else {
          console.error('Failed to play menu music');
        }
      });
    } catch (error) {
      console.error('Error starting menu music:', error);
    }
  }

  stopMusic(): void {
    if (this.musicInstance && Sound) {
      try {
        this.musicInstance.stop();
      } catch (error) {
        console.error('Error stopping music:', error);
      }
      this.musicInstance = null;
    }
  }

  pauseMusic(): void {
    if (this.musicInstance && Sound) {
      try {
        this.musicInstance.pause();
      } catch (error) {
        console.error('Error pausing music:', error);
      }
    }
  }

  resumeMusic(): void {
    if (this.musicInstance && this.isMusicEnabled && Sound) {
      try {
        this.musicInstance.play();
      } catch (error) {
        console.error('Error resuming music:', error);
      }
    }
  }

  // Settings
  setMusicEnabled(enabled: boolean): void {
    this.isMusicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }

  setSoundEnabled(enabled: boolean): void {
    this.isSoundEnabled = enabled;
  }

  // Cleanup
  release(): void {
    // Stop music
    this.stopMusic();
    
    // Release all sounds
    if (Sound) {
      Object.values(this.sounds).forEach(sound => {
        if (sound) {
          try {
            sound.release();
          } catch (error) {
            console.error('Error releasing sound:', error);
          }
        }
      });
    }
    
    this.sounds = {};
    this.isInitialized = false;
  }
}

// Create singleton instance
const soundService = new SoundService();

// Auto-initialize when imported
soundService.initialize().catch(error => {
  console.error('Failed to auto-initialize SoundService:', error);
  // Don't throw, just log the error and continue
});

export default soundService;