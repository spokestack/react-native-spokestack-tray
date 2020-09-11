import RNSpokestack, {
  SpokestackConfig,
  SpokestackEvent,
  SynthesizeOptions
} from 'react-native-spokestack'
import { checkSpeech, requestSpeech } from './utils/permissions'

import { AppState } from 'react-native'
import getModels from './utils/getModels'
import mergeConfig from './utils/mergeConfig'
import rafForeground from './utils/rafForeground'
import { remove } from './utils/download'

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
let retryDownload = true
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

/**
 * Add a Spokestack listener to any of Spokestack's events
 *
 * ```js
 * import { addListener, SpokestackListenerType } from 'react-native-spokestack-tray'
 *
 * // ...
 * function initialized() {
 *   console.log('Spokestack initialized')
 * }
 * addListener(SpokestackListenerType.INIT, initialized)
 * ```
 */
export function addListener(type: ListenerType, fn: Listener) {
  // Only add if not present
  if (indexOfListener(type, fn) === -1) {
    listeners[type].push(fn)
  }
}

/**
 * Remove a Spokestack listener
 *
 * ```js
 * import { removeListener, SpokestackListenerType } from 'react-native-spokestack-tray'
 *
 * // ...
 * removeListener(SpokestackListenerType.INIT, initialized)
 * ```
 */
export function removeListener(type: ListenerType, fn: Listener) {
  const i = indexOfListener(type, fn)
  if (i > -1) {
    listeners[type].splice(i, 1)
  }
}

/**
 * Adds a Spokestack listener to any of Spokestack's events
 * to be removed the first time it runs.
 *
 * ```js
 * import { addListenerOnce, SpokestackListenerType } from 'react-native-spokestack-tray'
 *
 * // ...
 * addListenerOnce(SpokestackListenerType.INIT, () => {
 *   console.log('Spokestack initialized')
 * })
 * ```
 */
export function addListenerOnce(type: ListenerType, fn: Listener) {
  const once: Listener = (e) => {
    fn.call(null, e)
    removeListener(type, once)
  }
  addListener(type, once)
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
    rafForeground(fn)
  })
}

export interface SpokestackInitConfig {
  /** Show debug (trace) messages from react-native-spokestack */
  debug?: boolean
  /** Edit the transcript before passing it to onRecognize and classify */
  editTranscript?: (transcript: string) => string
  /**
   * Pass the URLs of your NLU model files.
   * These models will be automatically downloaded
   * the first time the app opens, and then saved.
   * This is required for the NLU to work.
   * See https://spokestack.io/docs/Concepts/nlu
   */
  nluModelUrls: {
    nlu: string
    vocab: string
    metadata: string
  }
  /** Use this sparingly to refresh the models on device (force overwrite) */
  refreshModels?: boolean
  /** Passed straight to react-native-spokestack */
  spokestackConfig?: Partial<SpokestackConfig>
  /**
   * Pass the URLs of your wakeword model files.
   * These models will be automatically downloaded
   * the first time the app opens, and then saved.
   * If no URLs are provided, the tray will default to
   * the "Spokestack" wakeword.
   * See https://spokestack.io/docs/Concepts/wakeword-models
   */
  wakewordModelUrls?: {
    filter: string
    detect: string
    encode: string
  }
}

const rformat = /correct format.$/

async function init(config: SpokestackInitConfig): Promise<ListenerEvent> {
  if (initialized) {
    return
  }
  const editTranscript = config.editTranscript || ((transcript) => transcript)
  const [nluFiles, wakewordFiles] = await getModels(config, (error) => {
    execute(ListenerType.ERROR, { error })
  })

  // If any download failed, abort
  if (nluFiles.length !== 3 || wakewordFiles.length !== 3) {
    return
  }

  const spokestackOpts = mergeConfig(config, nluFiles, wakewordFiles)

  // Check for Spokestack client ID and secret
  if (
    !spokestackOpts.tts['spokestack-id'] ||
    !spokestackOpts.tts['spokestack-secret']
  ) {
    const error =
      'Spokestack client ID and secret are required. Go to https://spokestack.io/account to create a free token.'
    console.error(error)
    execute(ListenerType.ERROR, { error })
    return
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
  ).catch((error) => {
    if (retryDownload) {
      // If there's a problem with the format of existing model files,
      // try redownloading them once to fix them.
      retryDownload = false
      if (rformat.test(error.message)) {
        console.log('Removing model files and retrying init.')
        return remove(nluFiles.concat(wakewordFiles))
          .catch((errors) => {
            console.error(errors)
            throw new Error(
              'There was a problem removing stale model files. Please restart the app.'
            )
          })
          .then(() => init(config))
      }
    }
    throw error
  })
}

async function startPipeline() {
  if (listening || started) {
    console.log(
      `Not starting pipeline because ${
        listening ? 'already listening' : 'already started'
      }.`
    )
    return true
  }
  if (
    !initialized ||
    AppState.currentState === 'background' ||
    !(await checkSpeech())
  ) {
    return false
  }
  console.log('Starting')

  return runNativeCommand(ListenerType.START, () => {
    RNSpokestack.start()
  })
}

async function stopPipeline() {
  if (!initialized || !started) {
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

  if (!started) {
    await startPipeline()
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

/**
 * Tell Spokestack to start listening.
 * This will also open the tray.
 *
 * ```js
 * import { initialize, start } from 'react-native-spokestack-tray
 *
 * // ...
 *
 * componentDidMount() {
 *   // In most cases, you should call initialize
 *   // and start together.
 *   // This will initialize Spokestack and start wakeword.
 *   initialize().then(start)
 * }
 * ```
 */
export async function initialize(config: SpokestackInitConfig) {
  await queueCommand('initialize', init.bind(null, config))
  return initialized
}

/**
 * Tell Spokestack to start the speech pipeline,
 * beginning with the wakeword recognizer.
 * When the wakeword is heard, Spokestack will
 * start listening using ASR and open the tray.
 *
 * ```js
 * import { start } from 'react-native-spokestack-tray
 *
 * // ...
 *
 * start()
 * ```
 */
export async function start() {
  await queueCommand('start', startPipeline)
  return started
}

/**
 * Tell Spokestack to stop listening for the wakeword.
 * Note: this will also stop ASR.
 *
 * ```js
 * import { stop } from 'react-native-spokestack-tray
 *
 * // ...
 *
 * stop()
 * ```
 */
export async function stop() {
  await stopPipeline()
  return !started
}

/**
 * Tell Spokestack to start listening.
 * This will also open the tray.
 *
 * ```js
 * import { listen } from 'react-native-spokestack-tray'
 *
 * // ...
 *
 * await listen()
 * ```
 */
export async function listen() {
  console.log('Listening')
  const permission = await requestSpeech()
  if (permission) {
    await queueCommand('activate', activate)
  }
  return listening
}

/**
 * Tell Spokestack to stop listening with ASR.
 *
 * ```js
 * import { stopListening } from 'react-native-spokestack-tray'
 *
 * // ...
 *
 * stopListening()
 * ```
 */
export async function stopListening() {
  console.log('Stopping listening')
  await queueCommand('deactivate', deactivate)
  return !listening
}

/**
 * Tell Spokestack to synthesize the text.
 * This will return an object with a `url` property.
 * That url can be used to play audio.
 * The tray handles this automatically by playing the audio
 *   using react-native-video.
 * You shouldn't need to call this method directly.
 * Use the `say` component method instead.
 * ```js
 * import { synthesize, TTSFormat } from 'react-native-spokestack-tray
 *
 * // ...
 *
 * const { url } = await synthesize({
 *   input: 'This is something to say',
 *   format: TTSFormat.TEXT,
 *   voice: 'demo-male'
 * })
 * ```
 */
export async function synthesize(options?: SynthesizeOptions) {
  return queueCommand('synthesize', synthesizeSpeech.bind(null, options))
}

/**
 * Returns whether Spokestack has been initialized.
 * The tray initializes Spokestack on mount, but is an
 * async process.
 *
 * ```js
 * import { isInitialized } from 'react-native-spokestack-tray'
 *
 * if (isInitialized()) {
 *   // ...
 * }
 * ```
 */
export function isInitialized() {
  return initialized
}

/**
 * Returns whether Spokestack has started the speech pipeline.
 * The tray starts the pipeline when mounted, but this is
 * an async process.
 *
 * ```js
 * import { isStarted } from 'react-native-spokestack-tray'
 *
 * if (isStarted()) {
 *   // ...
 * }
 * ```
 */
export function isStarted() {
  return started
}

/**
 * Returns whether Spokestack is currently listening with ASR
 *
 * ```js
 * import { isListening } from 'react-native-spokestack-tray'
 *
 * if (isListening()) {
 *   // ...
 * }
 * ```
 */
export function isListening() {
  return listening
}
