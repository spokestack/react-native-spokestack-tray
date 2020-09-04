import SpokestackTray, { IntentResult } from './SpokestackTray'
export {
  listen,
  stopListening,
  isListening,
  isStarted,
  isInitialized,
  addListener,
  removeListener,
  ListenerEvent as SpokestackListenerEvent,
  ListenerType as SpokestackListenerType
} from './Spokestack'

export { IntentResult }
export default SpokestackTray
