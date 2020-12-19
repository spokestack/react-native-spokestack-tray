import {
  Animated,
  AppState,
  AppStateStatus,
  Dimensions,
  Easing,
  EasingFunction,
  GestureResponderEvent,
  Image,
  Keyboard,
  PanResponder,
  PanResponderGestureState,
  SafeAreaView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native'
import React, { PureComponent } from 'react'
import SpeechBubbles, { Bubble } from './components/SpeechBubbles'
import Spokestack, {
  PipelineProfile,
  SpokestackConfig,
  SpokestackErrorEvent,
  SpokestackNLUResult,
  SpokestackRecognizeEvent,
  TTSFormat,
  TraceLevel
} from 'react-native-spokestack'
import { getSilent, setSilent } from './utils/settings'
import { listen, stopListening } from './Spokestack'

import Color from 'color'
import HapticFeedback from 'react-native-haptic-feedback'
import Video from 'react-native-video'
import arrowImage from './images/icon-arrow-left.png'
import { checkSpeech } from './utils/permissions'
import merge from 'lodash/merge'
import micImage from './images/icon-mic.png'
import poweredImage from './images/powered-by-spokestack.png'
import soundOffImage from './images/icon-sound-off.png'
import soundOnImage from './images/icon-sound-on.png'

const errorMessage =
  'Sorry! We hit an error. Please check your network or restart the app and try again.'

export interface IntentResult {
  /**
   * A user-defined key to indicate where the user is in the conversation
   * Include this in the `exitNodes` prop if Spokestack should not listen
   *   again after saying the prompt.
   */
  node: string
  /** Will be processed into Speech unless the tray is in silent mode */
  prompt: string
  /**
   * Set to `true` to stop the wakeword recognizer
   * during playback of the prompt.
   */
  noInterrupt?: boolean
  /** Any other data you might want to add */
  data?: any
}

interface Props {
  /**
   * Your Spokestack tokens generated in your Spokestack account
   * at https://spokestack.io/account.
   * Create an account for free then generate a token.
   * This is from the "ID" field.
   */
  clientId: string
  /**
   * Your Spokestack tokens generated in your Spokestack account
   * at https://spokestack.io/account.
   * Create an account for free then generate a token.
   * This is from the "secret" field.
   */
  clientSecret: string
  /**
   * This function takes an intent from the NLU
   * and returns an object with a unique conversation
   * node name (that you define) and a prompt
   * to be processed by TTS and spoken.
   *
   * Note: the prompt is only shown in a chat bubble
   * if sound has been turned off.
   */
  handleIntent: (
    intent: string,
    slots?: any,
    utterance?: string
  ) => IntentResult
  /**
   * The NLU Tensorflow Lite model (.tflite), JSON metadata, and NLU vocabulary (.txt)
   *
   * All 3 fields accept 2 types of values.
   * 1. A string representing a remote URL from which to download and cache the file (presumably from a CDN).
   * 2. A source object retrieved by a `require` or `import` (e.g. `model: require('./nlu.tflite')`)
   *
   * See https://spokestack.io/docs/concepts/nlu to learn more about NLU.
   *
   * ```js
   * // ...
   * nlu={{
   *   model: 'https://somecdn.com/nlu.tflite',
   *   metadata: 'https://somecdn.com/metadata.json',
   *   vocab: 'https://somecdn.com/vocab.txt'
   * }}
   * ```
   *
   * You can also pass local files.
   * Note: this requires a change to your metro.config.js. For more info, see
   * "Including model files in your app bundle" in the README.md.
   *
   * ```js
   * // ...
   * nlu={{
   *   model: require('./nlu.tflite'),
   *   metadata: require('./metadata.json'),
   *   vocab: require('./vocab.txt')
   * }}
   * ```
   */
  nlu: SpokestackConfig['nlu']
  /** Width (and height) of the mic button */
  buttonWidth?: number
  /** How long to wait to close the tray after speaking (ms) */
  closeDelay?: number
  /** Show debug messages from react-native-spokestack */
  debug?: boolean
  /** Duration for the tray animation (ms) */
  duration?: number
  /** Easing function for the tray animation */
  easing?: EasingFunction
  /**
   * Edit the transcript before classification
   * and before the user response bubble is shown.
   */
  editTranscript?: (transcript: string) => string
  /**
   * All nodes in this array should end
   * the conversation and close the tray
   */
  exitNodes?: string[]
  /**
   * Font to use for "LISTENING...", "LOADING...",
   * and chat bubble text.
   */
  fontFamily?: string
  /**
   * Colors for the linear gradient shown when listening
   * Can be any number of colors (recommended: 2-3)
   */
  gradientColors?: string[]
  /**
   * Whether to greet the user with a welcome message
   * when the tray opens.
   * Note: `handleIntent` must respond to the "greet" intent.
   */
  greet?: boolean
  /**
   * Set this to false to disable the haptic
   * that gets played whenever the tray starts listening.
   */
  haptic?: boolean
  /** Minimum height for the tray */
  minHeight?: number
  /**
   * Called whenever the tray has closed
   */
  onClose?: () => void
  /** Called whenever there's an error from Spokestack */
  onError?: (e: SpokestackErrorEvent) => void
  /** Called whenever the tray has opened */
  onOpen?: () => void
  /**
   * The tray button can be oriented on either side of the screen
   */
  orientation?: 'left' | 'right'
  /**
   * This color is used to theme the tray
   * and is used in the mic button and speech bubbles.
   */
  primaryColor?: string
  /**
   * The Spokestack config profile to pass to
   * react-native-spokestack.
   * These are available from react-native-spokestack
   * starting in version 4.0.0.
   *
   * If Wakeword config files are specified, the default will be
   * `TFLITE_WAKEWORD_NATIVE_ASR`.
   * Otherwise, the default is `PTT_NATIVE_ASR`.
   *
   * ```js
   * import SpokestackTray from 'react-native-spokestack-tray'
   * import { PipelineProfile } from 'react-native-spokestack'
   *
   * // ...
   * <SpokestackTray
   *  profile={PipelineProfile.TFLITE_WAKEWORD_SPOKESTACK_ASR}
   * // ...
   * ```
   */
  profile?: PipelineProfile
  /**
   * Use this sparingly to refresh the
   * wakeword and NLU models on device
   * (force overwrite).
   * `<SpokestackTray refreshModels={process.env.NODE_ENV !== 'production'} ... />`
   */
  refreshModels?: boolean
  /**
   * Whether to speak the greeting or only display
   * a chat bubble with the greet message,
   * even if sound is on.
   */
  sayGreeting?: boolean
  /** Replace the sound on image by passing an <Image /> */
  soundOnImage?: React.ReactNode
  /** Replace the sound off image by passing an <Image /> */
  soundOffImage?: React.ReactNode
  /**
   * Pass options directly to the Spokestack.initialize()
   * function from react-native-spokestack.
   * See https://github.com/spokestack/react-native-spokestack
   * for available options.
   */
  spokestackConfig?: Partial<SpokestackConfig>
  /** Starting height for tray */
  startHeight?: number
  /** This style prop is passed to the tray's container */
  style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>
  /** The format for the text passed to Spokestack.synthesize */
  ttsFormat?: TTSFormat
  /** A key for a voice in Spokestack ASR, passed to Spokestack.synthesize */
  voice?: string
  /**
   * The NLU Tensorflow Lite models (.tflite) for wakeword.
   *
   * All 3 fields accept 2 types of values.
   * 1. A string representing a remote URL from which to download and cache the file (presumably from a CDN).
   * 2. A source object retrieved by a `require` or `import` (e.g. `model: require('./nlu.tflite')`)
   *
   * See https://spokestack.io/docs/concepts/wakeword-models to learn more about Wakeword
   *
   * Spokestack offers sample wakeword model files ("Spokestack"):
   *
   * ```js
   * // ...
   * wakeword={{
   *   filter: 'https://d3dmqd7cy685il.cloudfront.net/model/wake/spokestack/filter.tflite',
   *   detect: 'https://d3dmqd7cy685il.cloudfront.net/model/wake/spokestack/detect.tflite',
   *   encode: 'https://d3dmqd7cy685il.cloudfront.net/model/wake/spokestack/encode.tflite'
   * }}
   * ```
   *
   * You can also download these models ahead of time and include them from local files.
   * Note: this requires a change to your metro.config.js. For more info, see
   * "Including model files in your app bundle" in the README.md.
   *
   * ```js
   * // ...
   * wakeword={{
   *   filter: require('./filter.tflite'),
   *   detect: require('./detect.tflite'),
   *   encode: require('./encode.tflite')
   * }}
   * ```
   */
  wakeword?: SpokestackConfig['wakeword']
}

interface State {
  bubbles: Bubble[]
  height: number
  listening: boolean
  listeningWidth: number
  loading: boolean
  open: boolean
  playerSource: string
  pressed: boolean
  silent: boolean
  startHeight: number
}

export default class SpokestackTray extends PureComponent<Props, State> {
  private wentToBackground: boolean
  private windowWidth = Dimensions.get('window').width
  private windowHeight: number
  private panX = new Animated.Value(0)
  private shadowOpacity = new Animated.Value(0)
  private listenWhenDone = false
  private utterance = ''
  private openPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      const { height } = this.state
      this.setState({ pressed: true, startHeight: height })
      const { width: windowWidth, height: windowHeight } = Dimensions.get(
        'window'
      )
      this.windowWidth = windowWidth
      this.windowHeight = windowHeight
    },
    onPanResponderMove: (_event, { dx, dy }) => {
      this.panX.setValue(this.constrainX(dx))
      this.setState({ height: this.constrainHeight(dy) })
    },
    onPanResponderRelease: (_event, { dx, dy }) => {
      const { orientation } = this.props
      const shouldOpen =
        (Math.abs(dx) < 2 && Math.abs(dy) < 2) ||
        (orientation === 'left'
          ? dx > this.windowWidth / 3
          : dx < -this.windowWidth / 3)
      this.openOrClose(shouldOpen)
    },
    onPanResponderTerminate: () => {
      this.openOrClose(false)
    }
  })
  private expandPanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      const { height } = this.state
      this.setState({ startHeight: height })
      this.windowHeight = Dimensions.get('window').height
    },
    onPanResponderMove: (
      _event: GestureResponderEvent,
      { dy }: PanResponderGestureState
    ) => {
      this.setState({ height: this.constrainHeight(dy) })
    }
  })

  static defaultProps: Partial<Props> = {
    buttonWidth: 60,
    closeDelay: 0,
    duration: 500,
    editTranscript: (transcript) => transcript,
    easing: Easing.bezier(0.77, 0.41, 0.2, 0.84),
    gradientColors: ['#61fae9', '#2F5BEA'],
    greet: false,
    haptic: true,
    minHeight: 170,
    orientation: 'left',
    primaryColor: '#2f5bea',
    sayGreeting: true,
    soundOnImage: (
      <Image source={soundOnImage} style={{ width: 30, height: 30 }} />
    ),
    soundOffImage: (
      <Image source={soundOffImage} style={{ width: 30, height: 30 }} />
    ),
    startHeight: 220,
    ttsFormat: TTSFormat.TEXT,
    voice: 'demo-male'
  }

  state: State = {
    bubbles: [],
    height: this.props.startHeight,
    listening: false,
    listeningWidth: 0,
    loading: false,
    open: false,
    playerSource: '',
    pressed: false,
    silent: false,
    startHeight: this.props.startHeight
  }

  async componentDidMount() {
    const {
      clientId,
      clientSecret,
      debug,
      nlu,
      profile,
      refreshModels,
      spokestackConfig = {},
      wakeword
    } = this.props
    await this.initState()
    this.addListeners()

    await Spokestack.initialize(
      clientId,
      clientSecret,
      merge(spokestackConfig, {
        traceLevel: debug ? TraceLevel.DEBUG : TraceLevel.NONE,
        refreshModels,
        pipeline: { profile },
        nlu,
        wakeword
      })
    ).catch(this.handleError)
    if (await checkSpeech()) {
      await Spokestack.start()
    }
    this.showHandle()
  }

  async componentWillUnmount() {
    this.removeListeners()
    await Spokestack.stop()
  }

  private async initState() {
    this.setState({ silent: await getSilent() })
  }

  private addListeners() {
    AppState.addEventListener('change', this.appStateChange)
    Spokestack.addEventListener('recognize', this.onRecognize)
    Spokestack.addEventListener('activate', this.onActivate)
    Spokestack.addEventListener('deactivate', this.onDeactivate)
    Spokestack.addEventListener('timeout', this.close)
    Spokestack.addEventListener('error', this.handleError)
  }

  private removeListeners() {
    AppState.removeEventListener('change', this.appStateChange)
    Spokestack.removeAllListeners()
  }

  private appStateChange = (nextAppState: AppStateStatus) => {
    console.log(
      `App state changed to ${nextAppState}, and wentToBackground is ${this.wentToBackground}`
    )
    // Enable/disable wakeword based on app state
    if (nextAppState === 'active' && this.wentToBackground) {
      this.wentToBackground = false
      console.log('App became active. Starting wakeword.')
      Spokestack.start()
    } else if (nextAppState === 'background') {
      this.wentToBackground = true
      console.log('App went to background. Stopping speech pipeline.')
      Spokestack.stop()
    }
  }

  private async handleIntent(result: SpokestackNLUResult) {
    const {
      closeDelay,
      exitNodes,
      handleIntent,
      onError,
      sayGreeting
    } = this.props
    const { silent } = this.state
    const response = handleIntent(result.intent, result.slots, this.utterance)
    console.log(`Processed intent ${result.intent}`, response)
    const shouldListen = exitNodes.indexOf(response.node) === -1
    if (response.prompt) {
      const isGreeting = result.intent === 'greet'
      if (silent || (isGreeting && !sayGreeting)) {
        this.addBubble({ text: response.prompt, isLeft: true })
        if (shouldListen) {
          setTimeout(listen, 200)
        } else {
          setTimeout(this.close, closeDelay)
        }
      } else {
        if (response.noInterrupt) {
          await Spokestack.stop()
        }
        this.listenWhenDone = shouldListen
        this.say(response.prompt)
      }
    } else if (onError) {
      onError({ error: 'No prompt returned in the response' })
    }
  }

  private onRecognize = async ({ transcript }: SpokestackRecognizeEvent) => {
    const { editTranscript, onError } = this.props
    console.log('[Spokestack onRecognize]:', transcript)
    this.utterance = transcript
    this.addBubble({ text: transcript, isLeft: false })
    const edited = editTranscript(transcript)
    console.log('Transcript after editing: ', edited)
    // Only call listeners if there's a transcript
    if (edited.length > 0) {
      const result = await Spokestack.classify(edited).catch((error) => {
        onError({ error: error.message })
      })
      if (result) {
        this.handleIntent(result)
      }
    }
  }

  private onActivate = () => {
    const { haptic } = this.props
    this.setState({ listening: true, loading: false }, this.open)
    if (haptic) {
      HapticFeedback.trigger('impactHeavy', { enableVibrateFallback: true })
    }
  }

  private onDeactivate = () => {
    this.setState({ listening: false })
  }

  private handleError = (error: SpokestackErrorEvent) => {
    this.setState({ listening: false })
    this.addBubble({
      text: errorMessage,
      isLeft: true
    })
    const { onError } = this.props
    if (onError) {
      onError(error)
    }
  }

  private showHandle = () => {
    const { buttonWidth, easing, orientation } = this.props
    Animated.timing(this.panX, {
      duration: 200,
      easing,
      useNativeDriver: true,
      toValue: (buttonWidth / 2) * (orientation === 'right' ? -1 : 1)
    }).start()
  }

  private onEnd = () => {
    console.log('onEnd listenWhenDone', this.listenWhenDone)
    this.setState({ playerSource: null }, async () => {
      if (this.listenWhenDone) {
        this.listenWhenDone = false
        setTimeout(listen, 200)
      } else {
        setTimeout(this.close, this.props.closeDelay)
      }
    })
  }

  private constrainX = (dx: number) => {
    const { buttonWidth, orientation } = this.props
    const closedXValue = buttonWidth / 2
    if (orientation === 'left') {
      return Math.min(
        Math.max(closedXValue, dx),
        this.windowWidth + closedXValue
      )
    }
    return Math.min(
      Math.max(-this.windowWidth - closedXValue, dx),
      -closedXValue
    )
  }

  private constrainHeight = (dy: number) => {
    const { minHeight } = this.props
    const { startHeight } = this.state
    return Math.min(Math.max(minHeight, startHeight - dy), this.windowHeight)
  }

  private async opened() {
    const { greet } = this.props
    const { listening } = this.state
    // Could already be listening in response to wakeword
    if (listening) {
      return
    }
    if (greet) {
      this.handleIntent({ intent: 'greet', confidence: 100, slots: [] })
    } else {
      listen()
    }
  }

  private async openOrClose(shouldOpen: boolean) {
    if (!shouldOpen) {
      // Set open to false to immediately show the mic button
      // Clear the player source as well to stop playing
      this.setState({ open: shouldOpen, playerSource: null })
    }
    this.setState({ pressed: false })
    const { buttonWidth, duration, easing, orientation } = this.props
    const { listening } = this.state
    this.windowWidth = Dimensions.get('window').width
    const closedXValue = buttonWidth / 2
    Animated.parallel([
      Animated.timing(this.panX, {
        duration,
        easing,
        useNativeDriver: true,
        toValue:
          orientation === 'left'
            ? shouldOpen
              ? this.windowWidth + closedXValue
              : closedXValue
            : shouldOpen
            ? -this.windowWidth - closedXValue
            : -closedXValue
      }),
      Animated.timing(this.shadowOpacity, {
        duration,
        easing,
        useNativeDriver: true,
        toValue: shouldOpen ? 0.25 : 0
      })
    ]).start(() => {
      const { onOpen, onClose } = this.props
      this.setState({ open: shouldOpen })
      if (shouldOpen) {
        Keyboard.dismiss()
        // Check here as well as it could
        // have tried to start listening
        // and then stopped due to error
        // during the animation.
        // opened() would then try to listen again,
        // causing an infinite loop
        if (!listening) {
          this.opened()
        }
        if (onOpen) {
          onOpen()
        }
      } else {
        stopListening().then(Spokestack.start)
        if (onClose) {
          onClose()
        }
      }
    })
  }

  /**
   * Open the tray, greet (if applicable), and listen
   */
  open = () => {
    const { open } = this.state
    if (open) {
      return
    }
    this.openOrClose(true)
  }

  /**
   * Close the tray, stop listening, and restart wakeword
   */
  close = () => {
    const { open } = this.state
    if (!open) {
      return
    }
    this.openOrClose(false)
  }

  /**
   * Passes the input to Spokestack.synthesize(),
   * plays the audio, and adds a speech bubble.
   */
  say = async (input: string) => {
    const { onError, ttsFormat: format, voice } = this.props
    // Don't listen for wakeword if we're about to close the tray
    // This also helps with false positives on
    // goodbye messages that may include the wakeword.
    if (!this.listenWhenDone) {
      await Spokestack.stop()
    }
    this.setState({ loading: true }, () => {
      Spokestack.synthesize(input, format, voice)
        .then((url) => {
          if (url) {
            this.setState({ playerSource: url })
          } else {
            console.log(
              `Synthesize unsuccessful for input ${input}, going to onEnd`
            )
            this.setState({ loading: false }, this.onEnd)
          }
          this.addBubble({ text: input, isLeft: true })
        })
        .catch((error) => {
          this.setState({ loading: false })
          if (onError) {
            onError(error)
          }
        })
    })
  }

  /**
   * Add a bubble (system or user)
   * to the chat interface
   */
  addBubble = (bubble: Bubble) => {
    const { bubbles } = this.state
    // Avoid repeating a bubble
    const last = bubbles[bubbles.length - 1]
    if (!last || last.text !== bubble.text || last.isLeft !== bubble.isLeft) {
      // Only add one bubble with an error message
      this.setState({
        bubbles: bubbles
          .filter((bubble) => bubble.text !== errorMessage)
          .concat(bubble)
      })
    }
  }

  /**
   * Toggle silent mode
   */
  toggleSilent = () => {
    const { playerSource, silent } = this.state
    if (!silent && playerSource) {
      this.onEnd()
    }
    this.setState({ silent: !silent })
    return setSilent(!silent)
  }

  /**
   * Returns whether the tray is in silent mode
   */
  isSilent = () => {
    return this.state.silent
  }

  render() {
    const {
      buttonWidth,
      fontFamily,
      gradientColors,
      orientation,
      primaryColor,
      soundOnImage: soundOn,
      soundOffImage: soundOff,
      style
    } = this.props
    const {
      bubbles,
      height,
      listening,
      loading,
      open,
      playerSource,
      pressed,
      silent
    } = this.state
    const closedXValue = buttonWidth / 2
    return (
      <Animated.View
        style={[
          styles.container,
          orientation === 'left'
            ? {
                paddingRight: closedXValue,
                right: '100%'
              }
            : {
                paddingLeft: closedXValue,
                left: '100%'
              },
          {
            width: this.windowWidth + closedXValue,
            height,
            transform: [{ translateX: this.panX }]
          },
          style
        ]}
      >
        {!!playerSource && !silent && (
          <Video
            audioOnly
            allowsExternalPlayback
            playInBackground
            playWhenInactive
            paused={false}
            source={{ uri: playerSource }}
            onEnd={this.onEnd}
            onLoad={() => {
              this.setState({ loading: false })
            }}
            onError={(error) => {
              this.setState({ loading: false })
              console.log('[Player error]: ', error)
            }}
            onBuffer={({ isBuffering }) => {
              console.log('isBuffering', isBuffering)
            }}
          />
        )}
        {!open && (
          <View
            style={[
              styles.buttonView,
              orientation === 'left'
                ? {
                    right: 0,
                    alignItems: 'flex-end'
                  }
                : {
                    left: 0,
                    alignItems: 'flex-start'
                  },
              {
                width: buttonWidth,
                height: buttonWidth,
                borderRadius: buttonWidth,
                backgroundColor: pressed
                  ? Color(primaryColor).darken(0.2).toString()
                  : primaryColor
              }
            ]}
            {...this.openPanResponder.panHandlers}
          >
            <Image source={micImage} style={styles.mic} />
          </View>
        )}
        <Animated.View
          style={[styles.tray, { shadowOpacity: this.shadowOpacity }]}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.content}>
              <View
                style={[
                  styles.header,
                  orientation === 'left'
                    ? {
                        flexDirection: 'row'
                      }
                    : {
                        flexDirection: 'row-reverse'
                      }
                ]}
              >
                <View
                  style={styles.resizer}
                  {...this.expandPanResponder.panHandlers}
                >
                  <View style={styles.touchbar} pointerEvents="none" />
                  {loading && (
                    <Text style={[styles.loadingText, { fontFamily }]}>
                      LOADING ...
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.headerButton}
                  onPress={this.close}
                >
                  <Image
                    source={arrowImage}
                    style={[
                      styles.arrow,
                      orientation === 'right' && {
                        transform: [{ rotateY: '180deg' }]
                      }
                    ]}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={[styles.headerButton, styles.silentButton]}
                  onPress={this.toggleSilent}
                >
                  {silent ? soundOff : soundOn}
                </TouchableOpacity>
              </View>
              <SpeechBubbles
                backgroundSystem={Color(primaryColor).fade(0.9).toString()}
                bubbles={bubbles}
                fontFamily={fontFamily}
                gradientColors={gradientColors}
                listening={listening}
              />
              <View style={styles.powered} pointerEvents="none">
                <Image source={poweredImage} style={styles.poweredImage} />
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0
  },
  buttonView: {
    position: 'absolute',
    top: 7,
    padding: 8,
    flexDirection: 'column',
    justifyContent: 'center'
  },
  tray: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    shadowColor: '#262226',
    shadowOffset: {
      width: 0,
      height: -1
    },
    shadowRadius: 20,
    elevation: 20
  },
  content: {
    flex: 1,
    paddingBottom: 30
  },
  header: {
    position: 'relative',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    height: 55,
    backgroundColor: 'white',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#e7ebee'
  },
  resizer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    justifyContent: 'center',
    alignItems: 'center',

    // Support: Android
    // For some reason, a border is needed
    // for the this view to actually take up space
    borderWidth: 1,
    borderColor: 'transparent'
  },
  touchbar: {
    position: 'absolute',
    width: 40,
    height: 3,
    top: 10,
    left: '50%',
    marginLeft: -20,
    backgroundColor: '#e7ebee'
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)'
  },
  headerButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44
  },
  silentButton: {
    marginHorizontal: 5
  },
  arrow: {
    width: 14,
    height: 14
  },
  mic: {
    width: 20,
    height: 20
  },
  powered: {
    position: 'absolute',
    bottom: 10,
    left: '50%',
    marginLeft: -59
  },
  poweredImage: {
    width: 118,
    height: 16
  }
})
