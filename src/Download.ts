/**
 * Download streams for playback later
 */

import RNFetchBlob, { RNFetchBlobConfig } from 'rn-fetch-blob'

import { Alert } from 'react-native'
import NetInfo from '@react-native-community/netinfo'

interface File {
  filename: string
  id: string
}

export interface DownloadOptions {
  forceCellular?: boolean
  fetchBlobConfig?: RNFetchBlobConfig
}

/**
 * Check the network type before downloading
 */
async function checkNetwork(options: DownloadOptions) {
  const network = await NetInfo.fetch()
  switch (network.type) {
    case 'wifi':
    case 'vpn':
    case 'wimax':
    case 'ethernet':
    case 'bluetooth':
      return true
    case 'cellular':
      if (options.forceCellular) {
        return true
      }
      return new Promise((resolve) => {
        Alert.alert(
          'Cellular download',
          'This will download over cellular. Are you sure?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false)
            },
            {
              text: 'Download',
              onPress: () => resolve(true)
            }
          ]
        )
      })
    default:
      return false
  }
}

export async function download(
  url: string,
  file: Omit<File, 'filename'>,
  options: DownloadOptions = {}
): Promise<string> {
  if (typeof url !== 'string') {
    return Promise.reject(new Error('url argument is required for downloading'))
  }
  if (!file) {
    return Promise.reject(
      new Error('File argument is required for downloading')
    )
  }
  if (typeof file.id !== 'string') {
    return Promise.reject(
      new Error('File id argument is required for downloading')
    )
  }
  if (!(await checkNetwork(options))) {
    return Promise.reject(
      new Error(
        'Could not detect a usable network connection. Please check your network.'
      )
    )
  }
  const config = options.fetchBlobConfig || {}
  if (!config.appendExt) {
    config.appendExt = 'tflite'
  }
  const path = `${RNFetchBlob.fs.dirs.DocumentDir}/${file.id}.${config.appendExt}`
  const fileExists = await RNFetchBlob.fs.exists(path)

  if (fileExists && !config.overwrite) {
    console.log(`Returning existing file at ${path}`)
    return path
  }

  return RNFetchBlob.config({
    ...config,
    path,
    // We already returned for overwrite: false
    overwrite: true
  })
    .fetch('GET', url)
    .then(async (res) => {
      const path = res.path()
      console.log(`File saved to ${path}`)
      return path
    })
}
