/**
 * Download streams for playback later
 */

import { Alert, Platform } from 'react-native'
import RNFetchBlob, { RNFetchBlobConfig } from 'rn-fetch-blob'

import AsyncStorage from '@react-native-community/async-storage'
import NetInfo from '@react-native-community/netinfo'
import find from 'lodash/find'
import findIndex from 'lodash/findIndex'

const DOWNLOAD_LIST_KEY = 'spokestack_tray_downloads_v1'

interface File {
  filename: string
  id: string
}

export interface DownloadOptions {
  onProgress?: (progress: number) => void
  forceCellular?: boolean
  fetchBlobConfig?: RNFetchBlobConfig
}

let files: File[]
// A list of IDs currently downloading
const currentlyDownloading: string[] = []

function handleError(error: Error, message: string) {
  console.error('Download error', message, error)
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
      throw new Error('Please verify your network connection.')
  }
}

export function fileExists(file?: File) {
  if (!file || !file.filename) {
    return false
  }
  return RNFetchBlob.fs.exists(pathForFilename(file.filename))
}

export async function getFile(id: string) {
  if (!files) {
    await getFiles()
  }
  const file = find(files, { id })
  if (await fileExists(file)) {
    return file
  }
  return null
}

function getDir() {
  return Platform.OS === 'ios'
    ? `${RNFetchBlob.fs.dirs.DocumentDir}/RNFetchBlob_tmp`
    : RNFetchBlob.fs.dirs.DocumentDir
}

export function pathForFilename(filename: string) {
  return `${getDir()}/${filename}`
}

async function getFiles(): Promise<File[]> {
  if (files) {
    return files
  }
  try {
    files = JSON.parse(await AsyncStorage.getItem(DOWNLOAD_LIST_KEY))
    if (!Array.isArray(files)) {
      files = []
    }
  } catch (e) {
    handleError(e, 'Error retrieving file list from storage')
  }
  // console.log('\n\n\n===============Files from storage==============\n\n\n')
  // console.log(files)
  return files
}

async function persist(newFiles: File[]) {
  // console.log('\n\n\n===============Updating download list==============\n\n\n')
  // console.log(files)
  try {
    await AsyncStorage.setItem(DOWNLOAD_LIST_KEY, JSON.stringify(newFiles))
  } catch (e) {
    handleError(e, 'Could not persist file list to storage')
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
    return null
  }
  // Use the main source of truth instead of shadowing files
  // to allow simultaneous downloads/race conditions.
  // i.e. all calls to download should alter the
  // same files object
  if (!files) {
    await getFiles()
  }
  const config = options.fetchBlobConfig || {}
  const existingFile = await getFile(file.id)
  if (existingFile && !config.overwrite) {
    return pathForFilename(existingFile.filename)
  }

  // Don't download if already downloading
  if (isDownloading(file.id)) {
    return null
  }
  currentlyDownloading.push(file.id)

  const promise = RNFetchBlob.config({
    appendExt: 'tflite',
    path:
      config.overwrite && existingFile
        ? pathForFilename(existingFile.filename)
        : undefined,
    ...config,
    fileCache: true
  }).fetch('GET', url)

  // Triggers every 10%
  if (options.onProgress) {
    promise.progress({ count: 10 }, (received, total) => {
      options.onProgress(Math.floor((received / total) * 100))
    })
  }
  function removeFromDownloading() {
    const index = currentlyDownloading.indexOf(file.id)
    currentlyDownloading.splice(index, 1)
  }

  return promise
    .then(async (res) => {
      const path = res.path()
      // Find file again in case of a race condition
      let newFile: Partial<File> = find(files, { id: file.id })
      if (!newFile) {
        newFile = { id: file.id }
        files.push(newFile as File)
      }
      newFile.filename = (await RNFetchBlob.fs.stat(path)).filename
      await persist(files)
      removeFromDownloading()
      return path
    })
    .catch((error) => {
      removeFromDownloading()
      throw error
    })
}

export function isDownloading(id: string) {
  return currentlyDownloading.includes(id)
}

export async function remove(ids: string | string[]) {
  if (!files) {
    await getFiles()
  }
  if (typeof ids === 'string') {
    ids = [ids]
  }
  return Promise.all(
    ids.map(async (id) => {
      const index = findIndex(files, { id })
      const file = files[index]
      if (index > -1) {
        files.splice(index, 1)
      }
      if (!(await fileExists(file))) {
        return Promise.resolve()
      }
      return RNFetchBlob.fs
        .unlink(pathForFilename(file.filename))
        .then(() => persist(files))
        .catch((error) =>
          handleError(error, `Error removing download item with ID: ${id}`)
        )
    })
  )
}
