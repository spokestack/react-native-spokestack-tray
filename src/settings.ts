import AsyncStorage from '@react-native-community/async-storage'

const KEY_SILENT = 'spokestack-tray-silent-v1'
const KEY_MINIMIZED = 'spokestack-tray-minimized-v1'

export async function getSilent() {
  try {
    const silent = await AsyncStorage.getItem(KEY_SILENT)
    return !!silent
  } catch (e) {
    return false
  }
}

export async function setSilent(silent: boolean) {
  try {
    await AsyncStorage.setItem(KEY_SILENT, silent ? 'true' : '')
    return true
  } catch (e) {
    return false
  }
}

export async function getMinimized() {
  try {
    const minimized = await AsyncStorage.getItem(KEY_MINIMIZED)
    return !!minimized
  } catch (e) {
    return false
  }
}

export async function setMinimized(minimized: boolean) {
  try {
    await AsyncStorage.setItem(KEY_MINIMIZED, minimized ? 'true' : '')
    return true
  } catch (e) {
    return false
  }
}
