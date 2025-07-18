import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import SoundService from '../services/SoundService';
import { useUserStore } from '../store/useUserStore';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { username, setUsername } = useUserStore();
  
  const [soundEnabled, setSoundEnabled] = useState(SoundService.getSoundEnabled());
  const [musicVolume, setMusicVolume] = useState(SoundService.getMusicVolume());
  const [effectsVolume, setEffectsVolume] = useState(SoundService.getEffectsVolume());
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleSoundToggle = (value: boolean) => {
    setSoundEnabled(value);
    SoundService.setSoundEnabled(value);
    if (value) {
      SoundService.playButtonClick();
    }
  };

  const handleMusicVolumeChange = (value: number) => {
    setMusicVolume(value);
    SoundService.setMusicVolume(value);
  };

  const handleEffectsVolumeChange = (value: number) => {
    setEffectsVolume(value);
    SoundService.setEffectsVolume(value);
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all your progress? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            // Reset user data
            useUserStore.getState().resetProgress();
            Alert.alert('Success', 'Your progress has been reset.');
          }
        },
      ]
    );
  };

  const renderSettingItem = (
    icon: string, 
    title: string, 
    subtitle?: string, 
    rightElement?: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingIcon}>
        <Icon name={icon} size={24} color="#666" />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Filler Space */}
      <View style={styles.fillerSpace} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Sound Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound & Music</Text>
          
          {renderSettingItem(
            'volume-high',
            'Sound Effects',
            soundEnabled ? 'Enabled' : 'Disabled',
            <Switch
              value={soundEnabled}
              onValueChange={handleSoundToggle}
              trackColor={{ false: '#E0E0E0', true: '#FFB347' }}
              thumbColor="white"
            />
          )}

          {soundEnabled && (
            <>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Music Volume</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1}
                  value={musicVolume}
                  onValueChange={handleMusicVolumeChange}
                  minimumTrackTintColor="#FFB347"
                  maximumTrackTintColor="#E0E0E0"
                  thumbTintColor="#FF9F1C"
                />
                <Text style={styles.sliderValue}>{Math.round(musicVolume * 100)}%</Text>
              </View>

              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Effects Volume</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1}
                  value={effectsVolume}
                  onValueChange={handleEffectsVolumeChange}
                  minimumTrackTintColor="#FFB347"
                  maximumTrackTintColor="#E0E0E0"
                  thumbTintColor="#FF9F1C"
                />
                <Text style={styles.sliderValue}>{Math.round(effectsVolume * 100)}%</Text>
              </View>
            </>
          )}
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          {renderSettingItem(
            'notifications',
            'Notifications',
            'Daily reminders & achievements',
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#E0E0E0', true: '#FFB347' }}
              thumbColor="white"
            />
          )}

          {renderSettingItem(
            'moon',
            'Dark Mode',
            'Coming soon!',
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              disabled={true}
              trackColor={{ false: '#E0E0E0', true: '#FFB347' }}
              thumbColor="#ccc"
            />
          )}
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          {renderSettingItem(
            'person',
            'Username',
            username || 'CaBBy',
            <Icon name="chevron-forward" size={20} color="#999" />,
            () => {
              // Navigate to change username screen
            }
          )}

          {renderSettingItem(
            'trash',
            'Reset Progress',
            'Clear all data and start over',
            <Icon name="chevron-forward" size={20} color="#FF6B6B" />,
            handleResetProgress
          )}
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          {renderSettingItem(
            'information-circle',
            'Version',
            '1.0.0'
          )}

          {renderSettingItem(
            'heart',
            'Made with love',
            'By the BrainBites team'
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  fillerSpace: {
    height: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginLeft: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  sliderContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  slider: {
    height: 40,
  },
  sliderValue: {
    fontSize: 14,
    color: '#999',
    textAlign: 'right',
    marginTop: -8,
  },
});

export default SettingsScreen; 