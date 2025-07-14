import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

Sound.setCategory('Playback');

interface SoundEffects {
  correct: Sound | null;
  incorrect: Sound | null;
  levelUp: Sound | null;
  timerWarning: Sound | null;
  buttonClick: Sound | null;
  mascotPeek: Sound | null;
  mascotHappy: Sound | null;
  mascotSad: Sound | null;
  streakStart: Sound | null;
  streakContinue: Sound | null;
  streakBreak: Sound | null;
  goalComplete: Sound | null;
  backgroundMusic: Sound | null;
}

class SoundServiceClass {
  private sounds: SoundEffects = {
    correct: null,
    incorrect: null,
    levelUp: null,
    timerWarning: null,
    buttonClick: null,
    mascotPeek: null,
    mascotHappy: null,
    mascotSad: null,
    streakStart: null,
    streakContinue: null,
    streakBreak: null,
    goalComplete: null,
    backgroundMusic: null,
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
      levelUp: 'level_up.mp3',
      timerWarning: 'timer_warning.mp3',
      buttonClick: 'button_click.mp3',
      mascotPeek: 'mascot_peek.mp3',
      mascotHappy: 'mascot_happy.mp3',
      mascotSad: 'mascot_sad.mp3',
      streakStart: 'streak_start.mp3',
      streakContinue: 'streak_continue.mp3',
      streakBreak: 'streak_break.mp3',
      goalComplete: 'goal_complete.mp3',
      backgroundMusic: 'background_music.mp3',
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
          if (key === 'backgroundMusic' && this.sounds.backgroundMusic) {
            this.sounds.backgroundMusic.setNumberOfLoops(-1); // Loop infinitely
            this.sounds.backgroundMusic.setVolume(this.musicVolume);
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
      sound.setVolume(soundName === 'backgroundMusic' ? this.musicVolume : this.effectsVolume);
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

  playLevelUp() {
    this.playSound('levelUp');
  }

  playTimerWarning() {
    this.playSound('timerWarning');
  }

  playButtonClick() {
    this.playSound('buttonClick');
  }

  playMascotPeek() {
    this.playSound('mascotPeek');
  }

  playMascotHappy() {
    this.playSound('mascotHappy');
  }

  playMascotSad() {
    this.playSound('mascotSad');
  }

  playStreakSound(streakCount: number) {
    if (streakCount === 1) {
      this.playSound('streakStart');
    } else if (streakCount > 1) {
      this.playSound('streakContinue');
    }
  }

  playStreakBreak() {
    this.playSound('streakBreak');
  }

  playGoalComplete() {
    this.playSound('goalComplete');
  }

  playBackgroundMusic() {
    if (!this.isMuted && this.sounds.backgroundMusic) {
      this.sounds.backgroundMusic.play();
    }
  }

  stopBackgroundMusic() {
    this.sounds.backgroundMusic?.stop();
  }

  pauseBackgroundMusic() {
    this.sounds.backgroundMusic?.pause();
  }

  resumeBackgroundMusic() {
    if (!this.isMuted) {
      this.sounds.backgroundMusic?.play();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBackgroundMusic();
    } else {
      this.playBackgroundMusic();
    }
    this.saveSettings();
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.sounds.backgroundMusic?.setVolume(this.musicVolume);
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