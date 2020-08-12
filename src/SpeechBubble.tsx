import { StyleSheet, Text, TextProps, View, ViewProps } from 'react-native'

import React from 'react'

interface Props {
  isLeft?: boolean
  style?: ViewProps['style']
  textStyle?: TextProps['style']
  text?: string
}

export default function SpeechBubble({
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
              backgroundColor: '#fcf1f4',
              alignSelf: 'flex-start'
            }
          : {
              backgroundColor: '#f9f9f9',
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
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#262226'
  }
})
