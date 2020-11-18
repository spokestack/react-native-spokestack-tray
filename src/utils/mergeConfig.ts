import RNSpokestack, { SpokestackConfig } from 'react-native-spokestack'

import type { SpokestackInitConfig } from '../Spokestack'
import merge from 'lodash/merge'

export default function mergeConfig(
  config: SpokestackInitConfig,
  nluFiles: string[],
  wakewordFiles: string[]
): SpokestackConfig {
  const hasWakeword =
    !!wakewordFiles.length &&
    wakewordFiles.every((path) => typeof path === 'string')
  const hasNLU =
    !!nluFiles.length && nluFiles.every((path) => typeof path === 'string')
  return merge(
    {
      properties: {
        'spokestack-id': config.clientId,
        'spokestack-secret': config.clientSecret,
        'trace-level': config.debug
          ? RNSpokestack.TraceLevel.DEBUG
          : RNSpokestack.TraceLevel.NONE
      },
      pipeline: {
        // The default profile depends on whether wakeword models are present
        profile:
          config.profile ||
          (hasWakeword
            ? RNSpokestack.PipelineProfile.TFLITE_WAKEWORD_NATIVE_ASR
            : RNSpokestack.PipelineProfile.PTT_NATIVE_ASR),
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
        'pre-emphasis': 0.97
      }
    },
    hasWakeword && {
      pipeline: {
        'wake-filter-path': wakewordFiles[0],
        'wake-detect-path': wakewordFiles[1],
        'wake-encode-path': wakewordFiles[2]
      }
    },
    hasNLU && {
      nlu: {
        'nlu-model-path': nluFiles[0],
        'wordpiece-vocab-path': nluFiles[1],
        'nlu-metadata-path': nluFiles[2]
      }
    },
    config.spokestackConfig
  )
}
