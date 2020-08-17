import { StyleSheet, Text, TextProps, View, ViewProps } from 'react-native'

import Color from 'color'
import React from 'react'

interface Props {
  backgroundSystem?: string
  backgroundUser?: string
  isLeft?: boolean
  style?: ViewProps['style']
  textStyle?: TextProps['style']
  text?: string
}

export default function SpeechBubble({
  backgroundSystem = Color('#2f5bea').lighten(0.6).toString(),
  backgroundUser = '#f9f9f9',
  isLeft = false,
  style,
  text,
  textStyle
}: Props) {
  if (!text) {
    return <View />
  }
  return (
    <View
      style={[
        styles.bubble,
        isLeft
          ? {
              backgroundColor: backgroundSystem,
              alignSelf: 'flex-start'
            }
          : {
              backgroundColor: backgroundUser,
              alignSelf: 'flex-end'
            },
        style
      ]}
    >
      <Text style={[styles.bubbleText, textStyle]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '80%',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 10
  },
  bubbleText: {
    fontSize: 14,
    color: '#262226'
  }
})
