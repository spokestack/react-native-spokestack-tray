import React, { useEffect, useRef } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

import Listening from './Listening'
import SpeechBubble from './SpeechBubble'

export interface Bubble {
  text: string
  isLeft: boolean
}

interface Props {
  backgroundSystem?: string
  backgroundUser?: string
  bubbles: Bubble[]
  fontFamily: string
  gradientColors: string[]
  listening?: boolean
}

export default function SpeechBubbles({
  backgroundSystem,
  backgroundUser,
  bubbles,
  fontFamily,
  gradientColors,
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
          textStyle={{ fontFamily }}
          {...bubble}
        />
      ))}
      {listening && (
        <Listening gradientColors={gradientColors} textStyle={{ fontFamily }} />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    padding: 20
  }
})
