import SpokestackTray, {
  addEventListener,
  checkSpeech,
  isInitialized,
  isListening,
  isStarted,
  listen,
  removeAllListeners,
  removeEventListener,
  requestSpeech,
  stopListening
} from 'react-native-spokestack-tray'

describe('SpokestackTray', () => {
  it('should include the expected exports', () => {
    expect(SpokestackTray).toBeDefined()
    expect(listen).toBeDefined()
    expect(stopListening).toBeDefined()
    expect(isListening).toBeDefined()
    expect(isStarted).toBeDefined()
    expect(isInitialized).toBeDefined()
    expect(addEventListener).toBeDefined()
    expect(removeEventListener).toBeDefined()
    expect(removeAllListeners).toBeDefined()
    expect(checkSpeech).toBeDefined()
    expect(requestSpeech).toBeDefined()
  })
})
