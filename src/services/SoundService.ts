// src/services/SoundService.ts - Built from scratch
import { Platform } from 'react-native';

// Import sound library (you'll need to install react-native-sound)
// npm install react-native-sound
// @ts-ignore - Type definitions might not be available
import Sound from 'react-native-sound';

interface SoundEffect {
  sound: Sound | null;
  volume: number;
}

class SoundService {
  private soundsEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private soundEffectsVolume: number = 0.7;
  private musicVolume: number = 0.3;
  private currentMusic: Sound | null = null;
  private soundEffects: Map<string, SoundEffect> = new Map();
  private isInitialized: boolean = false;
  
  constructor() {
    this.initializeAudio();
  }
  
  private async initializeAudio() {
    try {
      // Enable playback in silence mode (iOS)
      Sound.setCategory('Playback');
      
      // Preload sound effects
      await this.preloadSounds();
      
      this.isInitialized = true;
      console.log('✓ SoundService initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing SoundService:', error);
      this.isInitialized = false;
    }
  }
  
  private async preloadSounds() {
    const soundFiles = {
      // Quiz sounds
      correct: require('../assets/sounds/correct.mp3'),
      incorrect: require('../assets/sounds/incorrect.mp3'),
      streak: require('../assets/sounds/streak.mp3'),
      
      // UI sounds
      buttonPress: require('../assets/sounds/button.mp3'),
      notification: require('../assets/sounds/notification.mp3'),
      
      // Background music
      menuMusic: require('../assets/sounds/menu_music.mp3'),
      gameMusic: require('../assets/sounds/game_music.mp3'),
    };
    
    // Preload each sound effect
    for (const [key, soundFile] of Object.entries(soundFiles)) {
      try {
        const sound = new Sound(soundFile, (error: any) => {
          if (error) {
            console.log(`Failed to load sound ${key}:`, error);
            return;
          }
          
          // Set volume for sound effects vs music
          const volume = key.includes('Music') ? this.musicVolume : this.soundEffectsVolume;
          sound.setVolume(volume);
          
          this.soundEffects.set(key, {
            sound: sound,
            volume: volume
          });
          
          console.log(`✓ Loaded sound: ${key}`);
        });
      } catch (error) {
        console.error(`❌ Error loading sound ${key}:`, error);
        // Add placeholder entry so we don't crash
        this.soundEffects.set(key, {
          sound: null,
          volume: this.soundEffectsVolume
        });
      }
    }
  }
  
  // Play sound effect
  private playSound(soundKey: string, volume?: number) {
    if (!this.isInitialized || !this.soundsEnabled) {
      return;
    }
    
    const soundEffect = this.soundEffects.get(soundKey);
    if (!soundEffect || !soundEffect.sound) {
      console.warn(`Sound not found: ${soundKey}`);
      return;
    }
    
    try {
      // Set volume if provided
      if (volume !== undefined) {
        soundEffect.sound.setVolume(volume);
      }
      
      // Play the sound
      soundEffect.sound.play((success: boolean) => {
        if (!success) {
          console.log(`Failed to play sound: ${soundKey}`);
        }
      });
    } catch (error) {
      console.error(`Error playing sound ${soundKey}:`, error);
    }
  }
  
  // Quiz-specific sounds
  playCorrect() {
    this.playSound('correct');
  }
  
  playIncorrect() {
    this.playSound('incorrect');
  }
  
  playStreak() {
    this.playSound('streak', 0.8); // Slightly louder for celebration
  }
  
  // UI sounds
  playButtonPress() {
    this.playSound('buttonPress', 0.5); // Quieter for UI feedback
  }
  
  playNotification() {
    this.playSound('notification');
  }
  
  // Background music
  startMenuMusic() {
    if (!this.musicEnabled) return;
    
    this.stopMusic(); // Stop any current music
    
    const menuMusic = this.soundEffects.get('menuMusic');
    if (menuMusic && menuMusic.sound) {
      try {
        menuMusic.sound.setNumberOfLoops(-1); // Loop indefinitely
        menuMusic.sound.setVolume(this.musicVolume);
        menuMusic.sound.play((success: boolean) => {
          if (success) {
            this.currentMusic = menuMusic.sound;
            console.log('🎵 Menu music started');
          }
        });
      } catch (error) {
        console.error('Error starting menu music:', error);
      }
    }
  }
  
  startGameMusic() {
    if (!this.musicEnabled) return;
    
    this.stopMusic(); // Stop any current music
    
    const gameMusic = this.soundEffects.get('gameMusic');
    if (gameMusic && gameMusic.sound) {
      try {
        gameMusic.sound.setNumberOfLoops(-1); // Loop indefinitely
        gameMusic.sound.setVolume(this.musicVolume * 0.8); // Slightly quieter during gameplay
        gameMusic.sound.play((success: boolean) => {
          if (success) {
            this.currentMusic = gameMusic.sound;
            console.log('🎵 Game music started');
          }
        });
      } catch (error) {
        console.error('Error starting game music:', error);
      }
    }
  }
  
  stopMusic() {
    if (this.currentMusic) {
      try {
        this.currentMusic.stop();
        this.currentMusic = null;
        console.log('🎵 Music stopped');
      } catch (error) {
        console.error('Error stopping music:', error);
      }
    }
  }
  
  pauseMusic() {
    if (this.currentMusic) {
      try {
        this.currentMusic.pause();
        console.log('🎵 Music paused');
      } catch (error) {
        console.error('Error pausing music:', error);
      }
    }
  }
  
  resumeMusic() {
    if (this.currentMusic) {
      try {
        this.currentMusic.play();
        console.log('🎵 Music resumed');
      } catch (error) {
        console.error('Error resuming music:', error);
      }
    }
  }
  
  // Volume controls
  setSoundEffectsVolume(volume: number) {
    this.soundEffectsVolume = Math.max(0, Math.min(1, volume));
    
    // Update all non-music sounds
    for (const [key, soundEffect] of this.soundEffects.entries()) {
      if (!key.includes('Music') && soundEffect.sound) {
        soundEffect.sound.setVolume(this.soundEffectsVolume);
        soundEffect.volume = this.soundEffectsVolume;
      }
    }
  }
  
  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    // Update music sounds
    for (const [key, soundEffect] of this.soundEffects.entries()) {
      if (key.includes('Music') && soundEffect.sound) {
        soundEffect.sound.setVolume(this.musicVolume);
        soundEffect.volume = this.musicVolume;
      }
    }
    
    // Update current playing music
    if (this.currentMusic) {
      this.currentMusic.setVolume(this.musicVolume);
    }
  }
  
  // Toggle sounds on/off
  toggleSounds(enabled: boolean) {
    this.soundsEnabled = enabled;
    
    if (!enabled) {
      this.stopMusic();
    }
    
    console.log(`🔊 Sounds ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  toggleMusic(enabled: boolean) {
    this.musicEnabled = enabled;
    
    if (!enabled) {
      this.stopMusic();
    }
    
    console.log(`🎵 Music ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  // Get current settings
  getSoundSettings() {
    return {
      soundsEnabled: this.soundsEnabled,
      musicEnabled: this.musicEnabled,
      soundEffectsVolume: this.soundEffectsVolume,
      musicVolume: this.musicVolume,
      isInitialized: this.isInitialized
    };
  }
  
  // Test sound (for settings screen)
  testSound() {
    this.playButtonPress();
  }
  
  // Cleanup when app closes
  cleanup() {
    console.log('🧹 Cleaning up SoundService...');
    
    // Stop current music
    this.stopMusic();
    
    // Release all sound resources
    for (const [key, soundEffect] of this.soundEffects.entries()) {
      if (soundEffect.sound) {
        try {
          soundEffect.sound.release();
        } catch (error) {
          console.error(`Error releasing sound ${key}:`, error);
        }
      }
    }
    
    this.soundEffects.clear();
    this.isInitialized = false;
  }
}

export default new SoundService();