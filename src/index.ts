import SpokestackTray, {
  IntentResult,
  SpokestackTrayProps
} from './SpokestackTray'

import Spokestack from 'react-native-spokestack'

export { listen, stopListening } from './Spokestack'

export { checkSpeech, requestSpeech } from './utils/permissions'

/**
 * Returns whether Spokestack is currently listening
 *
 * ```js
 * console.log(`isListening: ${await isListening()}`)
 * ```
 */
export const isListening = Spokestack.isActivated
/**
 * Returns whether Spokestack has been initialized
 *
 * ```js
 * console.log(`isInitialized: ${await isInitialized()}`)
 * ```
 */
export const isInitialized = Spokestack.isInitialized
/**
 * Returns whether the speech pipeline has been started
 *
 * ```js
 * console.log(`isStarted: ${await isStarted()}`)
 * ```
 */
export const isStarted = Spokestack.isStarted
/**
 * Bind to any event emitted by the native libraries
 * The events are: "recognize", "partial_recognize", "error", "activate", "deactivate", and "timeout".
 * See the bottom of the README.md for descriptions of the events.
 *
 * ```js
 * useEffect(() => {
 *   const listener = addEventListener('recognize', onRecognize)
 *   // Unsubscribe by calling remove when components are unmounted
 *   return () => {
 *     listener.remove()
 *   }
 * }, [])
 * ```
 */
export const addEventListener = Spokestack.addEventListener
/**
 * Remove an event listener
 *
 * ```js
 * removeEventListener('recognize', onRecognize)
 * ```
 */
export const removeEventListener = Spokestack.removeEventListener
/**
 * Remove any existing listeners
 *
 * ```js
 * componentWillUnmount() {
 *   removeAllListeners()
 * }
 * ```
 */
export const removeAllListeners = Spokestack.removeAllListeners
export { IntentResult, SpokestackTrayProps }
export { Bubble } from './components/SpeechBubbles'
export default SpokestackTray
