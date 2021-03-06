import { Alert, Platform, Rationale } from 'react-native'
import Permissions, { PERMISSIONS, Permission } from 'react-native-permissions'

const rationales: { [key: string]: Rationale } = {
  microphone: {
    title: 'Microphone access',
    message: 'For making voice requests',
    buttonPositive: 'Grant access'
  },
  speech: {
    title: 'Speech Recognition access',
    message: 'For understanding your voice requests',
    buttonPositive: 'Grant access'
  }
}

export function checkPermission(permission: Permission): Promise<boolean> {
  return Permissions.check(permission)
    .then((response) => response === 'granted')
    .catch((error) => {
      console.error(error)
      return false
    })
}

export function requestPermission(
  permission: Permission,
  rationale: Rationale
): Promise<boolean> {
  return Permissions.check(permission).then((response) => {
    console.log('Permissions check', response)
    if (response === 'granted') {
      return true
    }
    if (response !== 'blocked' || Platform.OS !== 'ios') {
      return Permissions.request(permission, rationale)
        .then((reqResponse) => {
          console.log('Permissions request', reqResponse)
          return reqResponse === 'granted'
        })
        .catch((error) => {
          console.error('Permission error', permission, error)
          return false
        })
    }

    Alert.alert(
      rationale.title,
      `Your permission is needed ${rationale.message.toLowerCase()}`,
      [
        { text: 'Not now' },
        {
          text: 'Open Settings',
          onPress: () => {
            Permissions.openSettings()
          }
        }
      ]
    )
    return false
  })
}

/**
 * This function can be used to check whether the user has given
 * the necessary permission for speech.
 * On iOS, this includes both microphone and speech recnogition.
 * On Android, only the microphone is needed.
 *
 * ```js
 * import { checkSpeech } from 'react-native-spokestack-tray'
 *
 * // ...
 *
 * const hasPermission = await checkSpeech()
 * ```
 */
export async function checkSpeech() {
  if (Platform.OS === 'ios') {
    const speech = await checkPermission(PERMISSIONS.IOS.SPEECH_RECOGNITION)
    console.log(`Speech Recognition permission is currently ${speech}.`)
    return speech
  }
  const mic = await checkPermission(PERMISSIONS.ANDROID.RECORD_AUDIO)
  console.log(`Microphone permission is currently ${mic}.`)
  return mic
}

/**
 * This function can be used to actually request
 * the necessary permission for speech.
 * On iOS, this includes both microphone and speech recnogition.
 * On Android, only the microphone is needed.
 *
 * Note: if the user has declined in the past on iOS,
 *  the user must be sent to Settings.
 *
 * ```js
 * import { requestSpeech } from 'react-native-spokestack-tray'
 *
 * // ...
 *
 * const hasPermission = await requestSpeech()
 * ```
 */
export async function requestSpeech() {
  if (Platform.OS === 'ios') {
    return requestPermission(
      PERMISSIONS.IOS.SPEECH_RECOGNITION,
      rationales.speech
    )
  }
  return requestPermission(
    PERMISSIONS.ANDROID.RECORD_AUDIO,
    rationales.microphone
  )
}
