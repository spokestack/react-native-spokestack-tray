/* global jest:false */
import { NativeModules } from 'react-native'

NativeModules.RNCAsyncStorage = jest.fn()
NativeModules.RNCNetInfo = jest.fn()

jest.mock('react-native-linear-gradient', () => jest.fn())
jest.mock('react-native-haptic-feedback', () => jest.fn())
jest.mock('react-native-permissions', () => jest.fn())
jest.mock('react-native-video', () => jest.fn())
jest.mock('react-native-spokestack', () => ({
  isInitialized: jest.fn(),
  isStarted: jest.fn(),
  isActivated: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  removeAllListeners: jest.fn(),
  TTSFormat: {
    TEXT: 'text'
  }
}))
