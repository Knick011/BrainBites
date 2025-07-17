import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enable playback in silence mode
Sound.setCategory('Playback');

interface SoundMap {
  [key: string]: Sound | null;
}

class SoundServiceClass {
  private sounds: SoundMap = {};
  private isSoundEnabled: boolean = true;
  private isMusicEnabled: boolean = true;
  private currentMusic: Sound | null = null;
  private isInitialized: boolean = false;

  async init() {
    console.log('Initializing SoundService');
    
    // Load preferences
    const soundEnabled = await AsyncStorage.getItem('sound_enabled');
    const musicEnabled = await AsyncStorage.getItem('music_enabled');
    
    this.isSoundEnabled = soundEnabled !== 'false';
    this.isMusicEnabled = musicEnabled !== 'false';
    
    // Preload all sounds
    await this.preloadSounds();
    
    this.isInitialized = true;
    console.log('SoundService initialized successfully');
  }

  private async preloadSounds() {
    const soundFiles = [
      { name: 'buttonpress', file: 'buttonpress.mp3' },
      { name: 'correct', file: 'correct.mp3' },
      { name: 'incorrect', file: 'incorrect.mp3' },
      { name: 'streak', file: 'streak.mp3' },
      { name: 'gamemusic', file: 'gamemusic.mp3' },
      { name: 'menumusic', file: 'menumusic.mp3' },
    ];

    const loadPromises = soundFiles.map(({ name, file }) => {
      return new Promise<void>((resolve) => {
        console.log(`Loading sound: ${file}`);
        
        const sound = new Sound(file, Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            console.error(`Failed to load sound ${file}:`, error);
            this.sounds[name] = null;
            resolve();
          } else {
            console.log(`Successfully loaded sound: ${file}`);
            this.sounds[name] = sound;
            
            // Set volume for music files
            if (name === 'gamemusic' || name === 'menumusic') {
              sound.setVolume(0.3); // Lower volume for background music
              sound.setNumberOfLoops(-1); // Loop indefinitely
            }
            
            resolve();
          }
        });
      });
    });

    await Promise.all(loadPromises);
  }

  private playSound(soundName: string, callback?: () => void) {
    if (!this.isInitialized) {
      console.warn('SoundService not initialized');
      callback?.();
      return;
    }

    if (!this.isSoundEnabled && soundName !== 'gamemusic' && soundName !== 'menumusic') {
      callback?.();
      return;
    }

    const sound = this.sounds[soundName];
    if (!sound) {
      console.warn(`Sound ${soundName} not loaded`);
      callback?.();
      return;
    }

    // Reset the sound to the beginning
    sound.setCurrentTime(0);
    
    sound.play((success) => {
      if (!success) {
        console.error(`Sound ${soundName} playback failed`);
      }
      callback?.();
    });
  }

  playButtonPress() {
    this.playSound('buttonpress');
  }

  playCorrect() {
    this.playSound('correct');
  }

  playIncorrect() {
    this.playSound('incorrect');
  }

  playStreak() {
    this.playSound('streak');
  }

  async playMenuMusic() {
    if (!this.isMusicEnabled || !this.isInitialized) return;

    // Stop any current music
    await this.stopMusic();

    const music = this.sounds['menumusic'];
    if (music) {
      this.currentMusic = music;
      music.setCurrentTime(0);
      music.setVolume(0.3);
      music.setNumberOfLoops(-1);
      
      music.play((success) => {
        if (!success) {
          console.error('Menu music playback failed');
          this.currentMusic = null;
        } else {
          console.log('Menu music started');
        }
      });
    }
  }

  async playGameMusic() {
    if (!this.isMusicEnabled || !this.isInitialized) return;

    // Stop any current music
    await this.stopMusic();

    const music = this.sounds['gamemusic'];
    if (music) {
      this.currentMusic = music;
      music.setCurrentTime(0);
      music.setVolume(0.3);
      music.setNumberOfLoops(-1);
      
      music.play((success) => {
        if (!success) {
          console.error('Game music playback failed');
          this.currentMusic = null;
        } else {
          console.log('Game music started');
        }
      });
    }
  }

  async stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop(() => {
        console.log('Music stopped');
      });
      this.currentMusic = null;
    }
  }

  async setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
    await AsyncStorage.setItem('sound_enabled', enabled ? 'true' : 'false');
  }

  async setMusicEnabled(enabled: boolean) {
    this.isMusicEnabled = enabled;
    await AsyncStorage.setItem('music_enabled', enabled ? 'true' : 'false');
    
    if (!enabled) {
      await this.stopMusic();
    }
  }

  isSoundEnabledStatus(): boolean {
    return this.isSoundEnabled;
  }

  isMusicEnabledStatus(): boolean {
    return this.isMusicEnabled;
  }

  cleanup() {
    // Stop all sounds and release resources
    this.stopMusic();
    
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.release();
      }
    });
    
    this.sounds = {};
    this.isInitialized = false;
  }
}

const SoundService = new SoundServiceClass();
export default SoundService;