import React, { useState } from 'react'
import { StyleSheet, Text, TextProps, View } from 'react-native'

import ListeningGradient from './ListeningGradient'

interface Props {
  gradientColors: string[]
  textStyle?: TextProps['style']
}

export default function Listening({ gradientColors, textStyle }: Props) {
  const [width, setWidth] = useState(0)

  return (
    <View
      style={styles.listening}
      onLayout={({ nativeEvent }) => {
        setWidth(nativeEvent.layout.width)
      }}
    >
      <ListeningGradient gradientColors={gradientColors} width={width} />
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
  listeningText: {
    fontSize: 18,
    color: 'white'
  }
})
