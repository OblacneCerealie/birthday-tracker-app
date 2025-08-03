import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface RainbowBadgeProps {
  text: string;
  style?: any;
  textStyle?: any;
}

export default function RainbowBadge({ text, style, textStyle }: RainbowBadgeProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 3000, // 3 seconds for full cycle
        useNativeDriver: false,
      })
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const startX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 0], // Move from left to right with wider coverage
  });

  return (
    <View style={[styles.badge, style]}>
      <Animated.View
        style={[
          styles.gradientContainer,
          {
            left: startX,
            width: 400, // Fixed wide width to ensure coverage
          },
        ]}
      >
        <LinearGradient
          colors={[
            '#FF0000', // Red
            '#FF7F00', // Orange
            '#FFFF00', // Yellow
            '#00FF00', // Green
            '#0000FF', // Blue
            '#4B0082', // Indigo
            '#9400D3', // Violet
            '#FF0000', // Red
            '#FF7F00', // Orange
            '#FFFF00', // Yellow
            '#00FF00', // Green
            '#0000FF', // Blue
            '#4B0082', // Indigo
            '#9400D3', // Violet
            '#FF0000', // Red
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
      <Text style={[styles.text, textStyle]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  gradientContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  text: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    zIndex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
}); 