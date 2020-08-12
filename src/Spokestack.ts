import { AppState, Platform } from 'react-native'
import RNSpokestack, {
  SpokestackConfig,
  SpokestackEvent,
  SynthesizeOptions
} from 'react-native-spokestack'
import { checkSpeech, requestSpeech } from './permissions'

import { download } from './Download'
import rafForeground from './rafForeground'

if (!process.env.BARTENDER_CLIENT_ID || !process.env.BARTENDER_CLIENT_SECRET) {
  throw new Error(
    'BARTENDER_CLIENT_ID and BARTENDER_CLIENT_SECRET are not set in the environment.'
  )
}

export enum ListenerType {
  CHANGE = 'change',
  INIT = 'init',
  START = 'start',
  STOP = 'stop',
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
  RECOGNIZE = 'recognize',
  CLASSIFICATION = 'classification',
  SUCCESS = 'success',
  TIMEOUT = 'timeout',
  ERROR = 'error'
}
export interface ListenerEvent extends SpokestackEvent {
  type: ListenerType
}

type Listener = (e: ListenerEvent) => void
interface Listeners {
  [key: string]: Listener[]
}

let initialized = false
let started = false
let listening = false
let stopOnError = true
const listeners: Listeners = {
  change: [],
  init: [],
  start: [],
  stop: [],
  activate: [],
  deactivate: [],
  recognize: [],
  classification: [],
  success: [],
  timeout: [],
  error: []
}

function indexOfListener(type: ListenerType, fn: Listener) {
  return listeners ? listeners[type].indexOf(fn) : -1
}

export function addListener(type: ListenerType, fn: Listener) {
  // Only add if not present
  if (indexOfListener(type, fn) === -1) {
    listeners[type].push(fn)
  }
}

export function addListenerOnce(type: ListenerType, fn: Listener) {
  const once: Listener = (e) => {
    fn.call(null, e)
    removeListener(type, once)
  }
  addListener(type, once)
}

export function removeListener(type: ListenerType, fn: Listener) {
  const i = indexOfListener(type, fn)
  if (i > -1) {
    listeners[type].splice(i, 1)
  }
}

function execute(type: ListenerType, e: SpokestackEvent) {
  listeners[type]
    // Always execute change listener
    .concat(listeners.change)
    .forEach((listener) => listener.call(null, { type, ...e }))
}

function runNativeCommand(
  type: ListenerType,
  fn: () => void,
  timeout = 10000
): Promise<ListenerEvent> {
  return new Promise<ListenerEvent>((resolve, reject) => {
    const timer = setTimeout(() => {
      const error = new Error(
        `No response from Spokestack native when running command ${type}`
      )
      execute(ListenerType.ERROR, { error: error.message })
      clearCommandQueue()
      reject(error)
    }, timeout)
    addListenerOnce(type, (e) => {
      clearTimeout(timer)
      resolve(e)
    })
    addListenerOnce(ListenerType.ERROR, (e: SpokestackEvent) => {
      clearTimeout(timer)
      reject(new Error(e.error))
    })
    fn()
  })
}

interface Config {
  /** Edit the transcript before passing it to onRecognize and classify */
  editTranscript?: (transcript: string) => string
}

async function init(config: Config = {}) {
  if (initialized) {
    return
  }
  const editTranscript = config.editTranscript || ((transcript) => transcript)

  const paths = await Promise.all([
    download(
      'https://d3dmqd7cy685il.cloudfront.net/model/wake/bartender/filter.tflite',
      { id: 'filter' },
      {
        forceCellular: true,
        fetchBlobConfig: { appendExt: 'tflite' }
      }
    ),
    download(
      'https://d3dmqd7cy685il.cloudfront.net/model/wake/bartender/detect.tflite',
      { id: 'detect' },
      {
        forceCellular: true,
        fetchBlobConfig: { appendExt: 'tflite' }
      }
    ),
    download(
      'https://d3dmqd7cy685il.cloudfront.net/model/wake/bartender/encode.tflite',
      { id: 'encode' },
      {
        forceCellular: true,
        fetchBlobConfig: { appendExt: 'tflite' }
      }
    ),
    download(
      'https://d3dmqd7cy685il.cloudfront.net/nlu/production/50c99428-28e9-431b-bd8c-999d841b1897/K2VHh5ZepPzjO4AozSs-1KybyeCIauDA5Xp8F0efIys/nlu.tflite',
      { id: 'nlu' },
      {
        forceCellular: true,
        fetchBlobConfig: { appendExt: 'tflite' }
      }
    ),
    download(
      'https://d3dmqd7cy685il.cloudfront.net/nlu/production/50c99428-28e9-431b-bd8c-999d841b1897/K2VHh5ZepPzjO4AozSs-1KybyeCIauDA5Xp8F0efIys/vocab.txt',
      { id: 'vocab' },
      {
        forceCellular: true,
        fetchBlobConfig: { appendExt: 'txt' }
      }
    ),
    download(
      'https://d3dmqd7cy685il.cloudfront.net/nlu/production/50c99428-28e9-431b-bd8c-999d841b1897/K2VHh5ZepPzjO4AozSs-1KybyeCIauDA5Xp8F0efIys/metadata.json',
      { id: 'metadata' },
      {
        forceCellular: true,
        fetchBlobConfig: { appendExt: 'json' }
      }
    )
  ]).catch((error) => {
    console.error('Failed to download Spokestack model files', error)
  })

  if (!paths || paths.filter((path) => typeof path === 'string').length !== 6) {
    console.error('Failed to download Spokestack model files', paths)
    return
  }

  const spokestackOpts: SpokestackConfig = {
    input: 'io.spokestack.spokestack.android.PreASRMicrophoneInput',
    stages: [
      'io.spokestack.spokestack.webrtc.AcousticNoiseSuppressor',
      'io.spokestack.spokestack.webrtc.AutomaticGainControl',
      'io.spokestack.spokestack.webrtc.VoiceActivityDetector',
      'io.spokestack.spokestack.wakeword.WakewordTrigger',
      'io.spokestack.spokestack.android.AndroidSpeechRecognizer',
      'io.spokestack.spokestack.ActivationTimeout'
    ],
    properties: {
      locale: 'en-US',
      'wake-filter-path': paths[0] as string,
      'wake-detect-path': paths[1] as string,
      'wake-encode-path': paths[2] as string,
      'ans-policy': 'aggressive',
      'agc-target-level-dbfs': 3,
      'agc-compression-gain-db': 15,
      'vad-mode': 'very-aggressive',
      'vad-fall-delay': 800,
      'wake-threshold': 0.9,
      'wake-active-min': 2000,
      'wake-active-max': 5000,
      'fft-window-size': 512,
      'fft-hop-length': 10,
      'pre-emphasis': 0.97,
      // 'trace-level': RNSpokestack.TraceLevel.DEBUG
      'trace-level': RNSpokestack.TraceLevel.NONE
    },
    tts: {
      ttsServiceClass: 'io.spokestack.spokestack.tts.SpokestackTTSService',
      'spokestack-id': process.env.BARTENDER_CLIENT_ID,
      'spokestack-secret': process.env.BARTENDER_CLIENT_SECRET
    },
    nlu: {
      'nlu-model-path': paths[3] as string,
      'wordpiece-vocab-path': paths[4] as string,
      'nlu-metadata-path': paths[5] as string
    }
  }

  RNSpokestack.onInit = (e) => {
    console.log('[Spokestack onInit]:', JSON.stringify(e))
    initialized = true
    execute(ListenerType.INIT, e)
  }
  RNSpokestack.onStart = async (e) => {
    console.log('[Spokestack onStart]:', JSON.stringify(e))
    started = true
    execute(ListenerType.START, e)
  }
  RNSpokestack.onStop = (e) => {
    console.log('[Spokestack onStop]:', JSON.stringify(e))
    started = false
    execute(ListenerType.STOP, e)
  }
  RNSpokestack.onActivate = async (e) => {
    console.log('[Spokestack onActivate]:', JSON.stringify(e))
    listening = true
    execute(ListenerType.ACTIVATE, e)
  }
  RNSpokestack.onDeactivate = async (e) => {
    console.log('[Spokestack onDeactivate]:', JSON.stringify(e))
    // Deactivate automatically restarts wakeword
    listening = false
    execute(ListenerType.DEACTIVATE, e)
  }
  RNSpokestack.onTimeout = async (e) => {
    console.log('[Spokestack onTimeout]:', JSON.stringify(e))
    execute(ListenerType.TIMEOUT, e)
  }
  RNSpokestack.onRecognize = async (e) => {
    stopOnError = true
    console.log('[Spokestack onRecognize]:', JSON.stringify(e))
    e.transcript = editTranscript(e.transcript)
    console.log('Transcript after editing: ', e.transcript)
    // Only call listeners if there's a transcript
    if (e.transcript.length > 0) {
      rafForeground(() => {
        listening = false
        execute(ListenerType.RECOGNIZE, e)
        rafForeground(() => RNSpokestack.classify(e.transcript))
      })
    }
  }
  RNSpokestack.onClassification = (e) => {
    console.log('[Spokestack onClassification]:', JSON.stringify(e.result))
    execute(ListenerType.CLASSIFICATION, e)
  }
  RNSpokestack.onSuccess = (e) => {
    console.log('[Spokestack onSuccess]:', e.url)
    execute(ListenerType.SUCCESS, e)
  }
  RNSpokestack.onError = (e) => {
    console.log('[Spokestack onError]:', e.error)
    if (
      typeof e.error === 'string' &&
      e.error.indexOf('kAFAssistantErrorDomain') === -1
    ) {
      console.error(e.error)
    }
    execute(ListenerType.ERROR, e)
    clearCommandQueue()
    // If there is an error in stop,
    // avoid an infinite loop of stop/error
    // Only resets on successful recognition
    if (stopOnError) {
      stopOnError = false
      console.log('Stopping due to stopOnError')
      stop()
    }
  }
  RNSpokestack.onTrace = (e) => {
    console.log('[Spokestack onTrace]:', JSON.stringify(e))
  }

  return runNativeCommand(
    ListenerType.INIT,
    () => {
      RNSpokestack.initialize(spokestackOpts)
    },
    // Give time to download model files
    60000
  )
}

async function startPipeline() {
  if (!(await checkSpeech())) {
    if (started || listening) {
      await stop()
    }
    return false
  }
  if (listening || started) {
    return true
  }
  if (!initialized || AppState.currentState !== 'active') {
    return false
  }
  console.log('Starting')

  return runNativeCommand(ListenerType.START, () => {
    RNSpokestack.start()
  })
}

async function stopPipeline() {
  if (!initialized) {
    return false
  }
  console.log('Stopping')
  return runNativeCommand(ListenerType.STOP, () => {
    RNSpokestack.stop()
  })
}

async function activate() {
  if (listening) {
    return true
  }
  if (
    !initialized ||
    AppState.currentState === 'background' ||
    !(await checkSpeech())
  ) {
    return false
  }
  console.log('Activating')

  if (Platform.OS === 'android' && !started) {
    await start()
  }

  return runNativeCommand(ListenerType.ACTIVATE, () => {
    RNSpokestack.activate()
  })
}

async function deactivate() {
  if (!listening) {
    return true
  }
  console.log('Deactivating')

  return runNativeCommand(ListenerType.DEACTIVATE, () => {
    RNSpokestack.deactivate()
  })
}

async function synthesizeSpeech(options?: SynthesizeOptions) {
  console.log('Synthesizing', options)
  if (!initialized) {
    throw new Error('Call initialize before using synthesize')
  }

  return runNativeCommand(
    ListenerType.SUCCESS,
    () => {
      RNSpokestack.synthesize(options)
    },
    // Give extra time for slow networks
    30000
  )
}

export function isInitialized() {
  return initialized
}

export function isStarted() {
  return started
}

export function isListening() {
  return listening
}

/**
 * Run all commands through a queue
 * This avoids several issues, such as calling
 * start before initialize is finished or
 * calling activate mid-start.
 */
interface Command<T = unknown> {
  name: string
  fn: Promise<T>
}
const commandQueue: Command[] = []

function getCommandPromises() {
  return commandQueue.map((command) => command.fn)
}

function logCommandQueue() {
  console.log(
    `Command queue: ${commandQueue.map((command) => command.name).join(', ')}`
  )
}

function clearCommandQueue() {
  commandQueue.splice(0, commandQueue.length)
}

function queueCommand<T = unknown>(name: string, fn: () => Promise<T>) {
  const promise = Promise.all(getCommandPromises()).then(fn)
  commandQueue.push({
    name,
    fn: promise
  })
  logCommandQueue()
  promise.then((result) => {
    const index = commandQueue.findIndex((command) => command.fn === promise)
    commandQueue.splice(index, 1)
    logCommandQueue()
    return result
  })

  return promise
}

export async function initialize(config: Config) {
  return queueCommand('initialize', init.bind(null, config))
}

export async function listen() {
  console.log('Listening')
  const permission = await requestSpeech()
  if (permission) {
    await queueCommand('activate', activate)
  }
  return listening
}

export async function stopListening() {
  console.log('Stopping listening')
  await queueCommand('deactivate', deactivate)
  return !listening
}

export async function start() {
  await queueCommand('start', startPipeline)
  return started
}

export async function stop() {
  await queueCommand('stop', stopPipeline)
  return !started
}

export async function synthesize(options?: SynthesizeOptions) {
  return queueCommand('synthesize', synthesizeSpeech.bind(null, options))
}
