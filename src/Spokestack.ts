import { AppState } from 'react-native'
import Spokestack from 'react-native-spokestack'
import { requestSpeech } from './utils/permissions'

export async function listen() {
  if (AppState.currentState !== 'background' && (await requestSpeech())) {
    if (!(await Spokestack.isStarted())) {
      await Spokestack.start()
    }
    await Spokestack.activate()
    return true
  }
  return false
}

export function stopListening() {
  return Spokestack.deactivate()
}
