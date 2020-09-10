import SpokestackTray, {
  addListener,
  checkSpeech,
  isInitialized,
  isListening,
  isStarted,
  listen,
  removeListener,
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
    expect(addListener).toBeDefined()
    expect(removeListener).toBeDefined()
    expect(checkSpeech).toBeDefined()
    expect(requestSpeech).toBeDefined()
  })
})
