import SpokestackTray, {
  isListening,
  listen
} from 'react-native-spokestack-tray'

describe('SpokestackTray', () => {
  it('should include the expected exports', () => {
    expect(SpokestackTray).toBeDefined()
    expect(listen).toBeDefined()
    expect(isListening).toBeDefined()
  })
})
