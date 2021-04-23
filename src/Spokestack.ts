import { AppState } from 'react-native'
import Spokestack from 'react-native-spokestack'
import { requestSpeech } from './utils/permissions'

/**
 * Tells the Spokestack speech pipeline to start listening.
 * Also requests permission to listen if necessary.
 * It will attempt to start the pipeline before activating
 * if not already started.
 * This function will do nothing if the app is in the background.
 *
 * ```
 * import { listen } from 'react-native-spokestack-tray'
 * try {
 *   await listen()
 * } catch (error) {
 *   console.error(error)
 * }
 * ```
 */
export async function listen() {
  if (AppState.currentState !== 'background' && (await requestSpeech())) {
    if (!(await Spokestack.isStarted())) {
      await Spokestack.start()
    }
    return Spokestack.activate()
  }
}

export function stopListening() {
  return Spokestack.deactivate()
}
