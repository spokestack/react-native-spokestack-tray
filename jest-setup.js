/* global jest:false */
const { NativeModules } = require('react-native')

NativeModules.RNCAsyncStorage = jest.fn()
NativeModules.RNCNetInfo = jest.fn()

jest.mock('react-native-permissions', () => jest.fn())
jest.mock('rn-fetch-blob', () => jest.fn())
jest.mock('react-native-spokestack', () => ({
  TTSFormat: {
    TEXT: 'text'
  }
}))
