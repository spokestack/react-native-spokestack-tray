import * as React from 'react'

import { StyleSheet, Text, View } from 'react-native'

import SpokestackTray from 'react-native-spokestack-tray'
import handleIntent from './Dialogue'

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Spokestack Example App (Minecraft)</Text>
      <Text style={styles.instructions}>
        Slide the tray open (➜) or say "Spokestack"
      </Text>
      <Text style={styles.start}>Then say "Help"</Text>
      <SpokestackTray
        greet
        exitNodes={['exit']}
        handleIntent={handleIntent}
        nluModelUrls={{
          nlu:
            'https://d3dmqd7cy685il.cloudfront.net/nlu/production/shared/XtASJqxkO6UwefOzia-he2gnIMcBnR2UCF-VyaIy-OI/nlu.tflite',
          vocab:
            'https://d3dmqd7cy685il.cloudfront.net/nlu/production/shared/XtASJqxkO6UwefOzia-he2gnIMcBnR2UCF-VyaIy-OI/vocab.txt',
          metadata:
            'https://d3dmqd7cy685il.cloudfront.net/nlu/production/shared/XtASJqxkO6UwefOzia-he2gnIMcBnR2UCF-VyaIy-OI/metadata.json'
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
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
  }
})
