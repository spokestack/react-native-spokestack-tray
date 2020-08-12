import * as React from 'react'

import { StyleSheet, View } from 'react-native'

import SpokestackTray from 'react-native-spokestack-tray'

export default function App() {
  return (
    <View style={styles.container}>
      <SpokestackTray />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
