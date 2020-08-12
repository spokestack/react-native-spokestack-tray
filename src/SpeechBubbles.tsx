import React, { useEffect, useRef } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

import SpeechBubble from './SpeechBubble'

export interface Bubble {
  text: string
  isLeft: boolean
}

interface Props {
  listening?: boolean
  bubbles: Bubble[]
}

export default function SpeechBubbles({ bubbles, listening }: Props) {
  const scrollView = useRef<ScrollView>()
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollView.current?.scrollToEnd({ animated: true })
    })
  }, [bubbles, listening])
  return (
    <ScrollView contentContainerStyle={styles.scrollView} ref={scrollView}>
      {bubbles.map((bubble, i) => (
        <SpeechBubble key={`bubble-${i}`} {...bubble} />
      ))}
      {listening && <SpeechBubble text={'\u2026'} />}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    padding: 20,
    paddingBottom: 30
  }
})
