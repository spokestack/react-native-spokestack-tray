import React, { useEffect, useRef } from 'react'
import { ScrollView, StyleSheet, TextProps } from 'react-native'

import SpeechBubble from './SpeechBubble'

export interface Bubble {
  text: string
  isLeft: boolean
}

interface Props {
  backgroundSystem?: string
  backgroundUser?: string
  bubbles: Bubble[]
  bubbleTextStyle?: TextProps['style']
  listening?: boolean
}

export default function SpeechBubbles({
  backgroundSystem,
  backgroundUser,
  bubbles,
  bubbleTextStyle,
  listening
}: Props) {
  const scrollView = useRef<ScrollView>()
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollView.current?.scrollToEnd({ animated: true })
    })
  }, [bubbles, listening])
  return (
    <ScrollView contentContainerStyle={styles.scrollView} ref={scrollView}>
      {bubbles.map((bubble, i) => (
        <SpeechBubble
          key={`bubble-${i}`}
          backgroundSystem={backgroundSystem}
          backgroundUser={backgroundUser}
          textStyle={bubbleTextStyle}
          {...bubble}
        />
      ))}
      {listening && (
        <SpeechBubble backgroundUser={backgroundUser} text={'\u2026'} />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    padding: 20,
    paddingBottom: 30
  }
})
