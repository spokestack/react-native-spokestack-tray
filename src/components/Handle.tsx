import { Animated, Easing, StyleSheet, ViewProps } from 'react-native'
import React, { useEffect, useRef } from 'react'

import ListeningGradient from './ListeningGradient'
import micImage from '../images/icon-mic.png'

interface Props extends ViewProps {
  buttonWidth: number
  extend: boolean
  extendWidth: number
  fontFamily: string
  gradientColors: string[]
  orientation: 'left' | 'right'
}

export default function Handle({
  buttonWidth,
  extend,
  extendWidth,
  fontFamily,
  gradientColors,
  orientation,
  style,
  ...props
}: Props) {
  const extendAnim = useRef(new Animated.Value(extend ? 1 : 0)).current
  useEffect(() => {
    Animated.timing(extendAnim, {
      duration: 200,
      easing: Easing.linear,
      useNativeDriver: true,
      toValue: extend ? 1 : 0
    }).start()

    return () => {
      extendAnim.stopAnimation()
    }
  }, [extend, extendAnim])

  const width = buttonWidth * 2 + extendWidth
  return (
    <Animated.View
      {...props}
      style={[
        styles.handle,
        orientation === 'left'
          ? {
              right: 0,
              alignItems: 'flex-end'
            }
          : {
              left: 0,
              alignItems: 'flex-start'
            },
        style,
        { width }
      ]}
    >
      {extend && (
        <ListeningGradient width={width} gradientColors={gradientColors} />
      )}
      <Animated.Image
        source={micImage}
        style={[
          styles.mic,
          {
            opacity: extendAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0]
            })
          }
        ]}
      />
      <Animated.Text
        style={[
          StyleSheet.absoluteFillObject,
          orientation === 'left'
            ? {
                left: buttonWidth
              }
            : {
                right: buttonWidth
              },
          styles.text,
          { fontFamily, opacity: extendAnim }
        ]}
      >
        LISTENING
      </Animated.Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  handle: {
    position: 'absolute',
    top: 7,
    height: 75,
    borderRadius: 75,
    flexDirection: 'column',
    justifyContent: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden'
  },
  mic: {
    width: 28,
    height: 28
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 72,
    textAlign: 'center',
    textAlignVertical: 'center'
  }
})
