import React, { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import SpokestackTray from 'react-native-spokestack-tray'
import handleIntent from './handleIntent'

export default function App() {
  // Used to only speak the greeting the first time
  const [sayGreeting, setSayGreeting] = useState(true)
  const [error, setError] = useState('')
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Spokestack Example App (Minecraft)</Text>
        <Text style={styles.instructions}>Slide the tray open (➜)</Text>
        <Text style={styles.wakeword}>
          After you've given the tray microphone permission, say "Spokestack" to
          open the tray again.
        </Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>
      {/* The tray should be added outside any navigation containers */}
      <SpokestackTray
        clientId={process.env.SPOKESTACK_CLIENT_ID}
        clientSecret={process.env.SPOKESTACK_CLIENT_SECRET}
        greet
        exitNodes={['exit']}
        handleIntent={(intent, slots, utterance) => {
          if (intent === 'greet') {
            // Since setting state is async,
            // the greeting still gets played the first time.
            setSayGreeting(false)
          }
          return handleIntent(intent, slots, utterance)
        }}
        onError={(event) => {
          setError(event.error)
        }}
        sayGreeting={sayGreeting}
        nlu={{
          model: 'https://s.spokestack.io/u/7fYxV/nlu.tflite',
          metadata: 'https://s.spokestack.io/u/7fYxV/metadata.json',
          vocab: 'https://s.spokestack.io/u/7fYxV/vocab.txt'
        }}
        wakeword={{
          detect: 'https://s.spokestack.io/u/hgmYb/detect.tflite',
          encode: 'https://s.spokestack.io/u/hgmYb/encode.tflite',
          filter: 'https://s.spokestack.io/u/hgmYb/filter.tflite'
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 100,
    alignItems: 'center'
  },
  content: {
    padding: 20
  },
  header: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 40
  },
  instructions: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10
  },
  start: {
    fontSize: 22,
    textAlign: 'center'
  },
  wakeword: {
    textAlign: 'center',
    marginBottom: 10
  }
})
