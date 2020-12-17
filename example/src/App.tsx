import React, { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import SpokestackTray from 'react-native-spokestack-tray'
import handleIntent from './handleIntent'

export default function App() {
  // Used to only speak the greeting the first time
  const [sayGreeting, setSayGreeting] = useState(true)
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Spokestack Example App (Minecraft)</Text>
        <Text style={styles.instructions}>Slide the tray open (➜)</Text>
        <Text style={styles.wakeword}>
          After you've given the tray microphone permission, say "Spokestack" to
          open the tray again.
        </Text>
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
        sayGreeting={sayGreeting}
        nlu={{
          model:
            'https://d3dmqd7cy685il.cloudfront.net/nlu/production/shared/XtASJqxkO6UwefOzia-he2gnIMcBnR2UCF-VyaIy-OI/nlu.tflite',
          vocab:
            'https://d3dmqd7cy685il.cloudfront.net/nlu/production/shared/XtASJqxkO6UwefOzia-he2gnIMcBnR2UCF-VyaIy-OI/vocab.txt',
          metadata:
            'https://d3dmqd7cy685il.cloudfront.net/nlu/production/shared/XtASJqxkO6UwefOzia-he2gnIMcBnR2UCF-VyaIy-OI/metadata.json'
        }}
        wakeword={{
          filter:
            'https://d3dmqd7cy685il.cloudfront.net/model/wake/spokestack/filter.tflite',
          detect:
            'https://d3dmqd7cy685il.cloudfront.net/model/wake/spokestack/detect.tflite',
          encode:
            'https://d3dmqd7cy685il.cloudfront.net/model/wake/spokestack/encode.tflite'
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
  start: {
    fontSize: 22,
    textAlign: 'center'
  },
  wakeword: {
    textAlign: 'center'
  }
})
