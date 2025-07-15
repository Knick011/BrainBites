import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface StreakIndicatorProps {
  streak: number;
}

const StreakIndicator: React.FC<StreakIndicatorProps> = ({ streak }) => {
  if (streak === 0) return null;

  return (
    <View style={styles.container}>
      <Icon name="flame" size={20} color="#FF6B6B" />
      <Text style={styles.streakText}>{streak}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  streakText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginLeft: 4,
    fontFamily: 'Nunito-Bold',
  },
});

export default StreakIndicator; 