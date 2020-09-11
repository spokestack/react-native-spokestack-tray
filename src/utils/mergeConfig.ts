import RNSpokestack, { SpokestackConfig } from 'react-native-spokestack'

import type { SpokestackInitConfig } from '../Spokestack'
import merge from 'lodash/merge'

export default function mergeConfig(
  config: SpokestackInitConfig,
  nluFiles: string[],
  wakewordFiles: string[]
): SpokestackConfig {
  return merge(
    {
      input: 'io.spokestack.spokestack.android.PreASRMicrophoneInput',
      stages: [
        'io.spokestack.spokestack.webrtc.AcousticNoiseSuppressor',
        'io.spokestack.spokestack.webrtc.AutomaticGainControl',
        'io.spokestack.spokestack.webrtc.VoiceActivityDetector',
        'io.spokestack.spokestack.wakeword.WakewordTrigger',
        'io.spokestack.spokestack.android.AndroidSpeechRecognizer',
        'io.spokestack.spokestack.ActivationTimeout'
      ],
      tts: {
        ttsServiceClass: 'io.spokestack.spokestack.tts.SpokestackTTSService'
      },
      nlu: {
        'nlu-model-path': nluFiles[0],
        'wordpiece-vocab-path': nluFiles[1],
        'nlu-metadata-path': nluFiles[2]
      },
      properties: {
        locale: 'en-US',
        'wake-filter-path': wakewordFiles[0],
        'wake-detect-path': wakewordFiles[1],
        'wake-encode-path': wakewordFiles[2],
        'ans-policy': 'aggressive',
        'agc-target-level-dbfs': 3,
        'agc-compression-gain-db': 15,
        'vad-mode': 'very-aggressive',
        'vad-fall-delay': 1000,
        'wake-threshold': 0.9,
        'wake-active-min': 2000,
        'wake-active-max': 6000,
        'fft-window-size': 512,
        'fft-hop-length': 10,
        'pre-emphasis': 0.97,
        'trace-level': config.debug
          ? RNSpokestack.TraceLevel.DEBUG
          : RNSpokestack.TraceLevel.NONE
      }
    },
    config.spokestackConfig
  )
}
