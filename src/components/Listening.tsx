import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TextProps,
  View
} from 'react-native'
import React, { useEffect, useRef, useState } from 'react'

import LinearGradient from 'react-native-linear-gradient'

interface Props {
  gradientColors: string[]
  textStyle?: TextProps['style']
}

export default function Listening({ gradientColors, textStyle }: Props) {
  const [width, setWidth] = useState(0)
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
    <View
      style={styles.listening}
      onLayout={({ nativeEvent }) => {
        setWidth(nativeEvent.layout.width)
      }}
    >
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
          style={[styles.gradient, { width: width }]}
        />
        <LinearGradient
          colors={[...gradientColors].reverse()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { width: width }]}
        />
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { width: width }]}
        />
      </Animated.View>
      <Text style={[styles.listeningText, textStyle]}>LISTENING</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  listening: {
    position: 'relative',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30
  },
  gradientWrap: {
    flexDirection: 'row'
  },
  gradient: {},
  listeningText: {
    fontSize: 18,
    color: 'white'
  }
})
