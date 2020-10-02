import { Animated, Easing, StyleSheet } from 'react-native'
import React, { useEffect, useRef } from 'react'

import LinearGradient from 'react-native-linear-gradient'

interface Props {
  gradientColors: string[]
  width: number
}

export default function ListeningGradient({ gradientColors, width }: Props) {
  const gradientAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(gradientAnim, {
        duration: 3000,
        easing: Easing.linear,
        isInteraction: false,
        useNativeDriver: true,
        toValue: 1
      })
    ).start()
  }, [gradientAnim])

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.gradientWrap,
        {
          transform: [
            {
              translateX: gradientAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -width * 2]
              })
            }
          ]
        }
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: width }}
      />
      <LinearGradient
        colors={[...gradientColors].reverse()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: width }}
      />
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: width }}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  gradientWrap: {
    flexDirection: 'row'
  }
})
