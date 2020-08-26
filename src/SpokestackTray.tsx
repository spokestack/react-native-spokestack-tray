import * as Spokestack from './Spokestack'

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
  LayoutChangeEvent,
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
import {
  EdgeInsets,
  SafeAreaInsetsContext,
  SafeAreaProvider
} from 'react-native-safe-area-context'
import React, { PureComponent } from 'react'
import SpeechBubbles, { Bubble } from './SpeechBubbles'
import {
  SpokestackNLUEvent,
  SpokestackRecognizeEvent,
  TTSFormat
} from 'react-native-spokestack'
import { getMinimized, getSilent, setMinimized, setSilent } from './settings'

import Color from 'color'
import HapticFeedback from 'react-native-haptic-feedback'
import LinearGradient from 'react-native-linear-gradient'
import Video from 'react-native-video'
import arrowImage from './images/icon-arrow-left.png'
import micImage from './images/icon-mic.png'
import poweredImage from './images/powered-by-spokestack.png'
import soundOffImage from './images/icon-sound-off.png'
import soundOnImage from './images/icon-sound-on.png'

export interface IntentResult {
  node: string
  prompt: string
  data?: any
}

interface SpokestackTrayProps {
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
   * The URLs of your NLU model files.
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
  /** Width (and height) of the mic button */
  buttonWidth?: number
  /** How long to wait to close the tray after speaking (ms) */
  closeDelay?: number
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
   * Default: false
   */
  greet?: boolean
  /**
   * Set this to false to disable the haptic
   * that gets played whenever the tray starts listening.
   */
  haptic?: boolean
  /** Height of the tray's header */
  headerHeight?: number
  /** Minimum height for the tray */
  minHeight?: number
  /** Height of the minimized bar */
  minimizedHeight?: number
  /** Set noMinimized: true to disable minimized mode */
  noMinimized?: boolean
  /**
   * Called whenever the tray has closed
   */
  onClose?: () => void
  /** Called whenever there's an error from Spokestack */
  onError?: (e: Spokestack.ListenerEvent) => void
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
   * Default: true
   */
  sayGreeting?: boolean
  /** Replace the sound on image by passing an <Image /> */
  soundOnImage?: React.ReactNode
  /** Replace the sound off image by passing an <Image /> */
  soundOffImage?: React.ReactNode
  /** Starting height for tray */
  startHeight?: number
  /**
   * This style prop is passed to the tray's content container.
   * Note: this is not the same at the top-most container,
   *   which is the animated view responsible for animations
   *   and gestures and should not get other styles.
   */
  style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>
  /** The format for the text passed to Spokestack.synthesize */
  ttsFormat?: TTSFormat
  /** A key for a voice in Spokestack ASR, passed to Spokestack.synthesize */
  voice?: string
  /**
   * The URLs of your wakeword model files.
   * These models will be automatically downloaded
   * the first time the app opens, and then saved.
   * If no wakeword model URLs are provided, Spokestack will default
   *  to the "Spokestack" wakeword.
   * See https://spokestack.io/docs/Concepts/wakeword-models
   */
  wakewordModelUrls?: {
    filter: string
    detect: string
    encode: string
  }
}

interface Props extends SpokestackTrayProps {
  insets?: EdgeInsets
}

interface State {
  bubbles: Bubble[]
  listening: boolean
  loading: boolean
  minimized: boolean
  open: boolean
  playerSource: string
  pressed: boolean
  silent: boolean
}

class SpokestackTray extends PureComponent<Props, State> {
  private wentToBackground: boolean
  private windowWidth = Dimensions.get('window').width
  private windowHeight: number
  private currentHeight: number // Current height of the container, even during animation
  private startHeight: number // Saved starting height for the move event
  private height = new Animated.Value(this.props.startHeight)
  private panX = new Animated.Value(0)
  private shadowOpacity = new Animated.Value(0)
  private gradientAnim = new Animated.Value(0)
  private listenWhenDone = false
  private utterance = ''
  private openPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      this.setState({ pressed: true })
      const { width: windowWidth, height: windowHeight } = Dimensions.get(
        'window'
      )
      this.windowWidth = windowWidth
      this.windowHeight = windowHeight
      this.startHeight = this.currentHeight
    },
    onPanResponderMove: (_event, { dx, dy }) => {
      this.height.setValue(this.constrainHeight(dy))
      this.panX.setValue(this.constrainX(dx))
    },
    onPanResponderRelease: (_event, { dx, dy }) => {
      this.setState({ pressed: false })
      const { orientation } = this.props
      const shouldOpen =
        (Math.abs(dx) < 10 && Math.abs(dy) < 10) ||
        (orientation === 'left'
          ? dx > this.windowWidth / 3
          : dx < -this.windowWidth / 3)
      this.openOrClose(shouldOpen)
    },
    onPanResponderTerminate: () => {
      this.setState({ pressed: false })
      this.openOrClose(false)
    }
  })
  private expandPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      this.setState({ pressed: true })
      this.startHeight = this.currentHeight
      this.windowHeight = Dimensions.get('window').height
    },
    onPanResponderMove: (
      _event: GestureResponderEvent,
      { dy }: PanResponderGestureState
    ) => {
      this.height.setValue(this.constrainHeight(dy))
    },
    onPanResponderRelease: (_event, { dy }) => {
      this.setState({ pressed: false })
      const { minHeight } = this.props
      const { minimized } = this.state
      if (minimized && Math.abs(dy) < 10) {
        Spokestack.listen()
        this.minimize()
      } else if (this.currentHeight < minHeight) {
        this.minimize()
      } else {
        this.unminimize()
      }
    },
    onPanResponderTerminate: () => {
      this.setState({ pressed: false })
      const { minimized } = this.state
      if (minimized) {
        this.minimize()
      } else {
        this.unminimize()
      }
    }
  })

  static defaultProps: Partial<Props> = {
    buttonWidth: 60,
    closeDelay: 0,
    duration: 500,
    easing: Easing.bezier(0.77, 0.41, 0.2, 0.84),
    gradientColors: ['#61fae9', '#2F5BEA'],
    greet: false,
    haptic: true,
    headerHeight: 55,
    minHeight: 180,
    minimizedHeight: 30,
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
    listening: false,
    loading: false,
    minimized: false,
    open: false,
    playerSource: '',
    pressed: false,
    silent: false
  }

  async componentDidMount() {
    const {
      clientId,
      clientSecret,
      refreshModels,
      wakewordModelUrls,
      nluModelUrls
    } = this.props
    await this.initState()
    this.addListeners()
    const initialized = await Spokestack.initialize({
      editTranscript: this.props.editTranscript,
      nluModelUrls,
      refreshModels,
      wakewordModelUrls,
      spokestackConfig: {
        tts: {
          'spokestack-id': clientId,
          'spokestack-secret': clientSecret
        }
      }
    })
    if (initialized) {
      Spokestack.start().then(this.bootstrap)
    }
  }

  componentWillUnmount() {
    this.removeListeners()
    Spokestack.stop()
  }

  private async initState() {
    const { noMinimized } = this.props
    const minimized = !noMinimized && (await getMinimized())
    this.setState({ minimized, silent: await getSilent() })
    if (minimized) {
      this.height.setValue(0)
      this.panX.setValue(this.getOpenX())
    }
  }

  private addListeners() {
    AppState.addEventListener('change', this.appStateChange)
    Spokestack.addListener(
      Spokestack.ListenerType.CLASSIFICATION,
      this.handleIntent
    )
    Spokestack.addListener(Spokestack.ListenerType.RECOGNIZE, this.userSaid)
    Spokestack.addListener(
      Spokestack.ListenerType.ACTIVATE,
      this.listeningStarted
    )
    Spokestack.addListener(
      Spokestack.ListenerType.DEACTIVATE,
      this.listeningStopped
    )
    Spokestack.addListener(Spokestack.ListenerType.TIMEOUT, this.close)
    Spokestack.addListener(Spokestack.ListenerType.ERROR, this.handleError)
  }

  private removeListeners() {
    AppState.removeEventListener('change', this.appStateChange)
    Spokestack.removeListener(
      Spokestack.ListenerType.CLASSIFICATION,
      this.handleIntent
    )
    Spokestack.removeListener(Spokestack.ListenerType.RECOGNIZE, this.userSaid)
    Spokestack.removeListener(
      Spokestack.ListenerType.ACTIVATE,
      this.listeningStarted
    )
    Spokestack.removeListener(
      Spokestack.ListenerType.DEACTIVATE,
      this.listeningStopped
    )
    Spokestack.removeListener(Spokestack.ListenerType.TIMEOUT, this.close)
    Spokestack.removeListener(Spokestack.ListenerType.ERROR, this.handleError)
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

  private handleIntent = ({ result }: SpokestackNLUEvent) => {
    const { closeDelay, exitNodes, handleIntent, onError } = this.props
    const { silent } = this.state
    const response = handleIntent(result.intent, result.slots, this.utterance)
    const shouldListen = exitNodes.indexOf(response.node) === -1
    if (response.prompt) {
      if (silent) {
        this.addBubble({ text: response.prompt, isLeft: true })
        if (shouldListen) {
          setTimeout(Spokestack.listen, 500)
        } else {
          setTimeout(this.close, closeDelay)
        }
      } else {
        this.listenWhenDone = shouldListen
        this.say(response.prompt)
      }
    } else if (onError) {
      onError({
        type: Spokestack.ListenerType.ERROR,
        error: 'No prompt returned in the response'
      })
    }
  }

  private userSaid = ({ transcript }: SpokestackRecognizeEvent) => {
    this.utterance = transcript
    this.addBubble({ text: transcript, isLeft: false })
  }

  private listeningStarted = () => {
    const { haptic } = this.props
    this.setState({ listening: true, loading: false }, this.open)
    if (haptic) {
      HapticFeedback.trigger('impactHeavy', { enableVibrateFallback: true })
    }
  }

  private listeningStopped = () => {
    this.setState({ listening: false })
  }

  private handleError = (error: Spokestack.ListenerEvent) => {
    this.setState({ listening: false })
    this.addBubble({
      text:
        'Sorry! We hit an error. Please check your network or restart the app and try again.',
      isLeft: true
    })
    const { onError } = this.props
    if (onError) {
      onError(error)
    }
  }

  private showHandle() {
    const { buttonWidth, easing, orientation } = this.props
    Animated.timing(this.panX, {
      duration: 200,
      easing,
      useNativeDriver: false,
      toValue: (buttonWidth / 2) * (orientation === 'right' ? -1 : 1)
    }).start()
  }

  private animateGradient() {
    Animated.loop(
      Animated.timing(this.gradientAnim, {
        duration: 3000,
        easing: Easing.linear,
        isInteraction: false,
        useNativeDriver: false,
        toValue: 1
      })
    ).start()
  }

  private showMinimized() {
    const { duration, easing } = this.props
    Animated.timing(this.height, {
      duration,
      easing,
      useNativeDriver: false,
      toValue: this.getMinimizedHeight()
    }).start()
  }

  private bootstrap = () => {
    const { minimized } = this.state
    if (minimized) {
      this.showMinimized()
    } else {
      this.showHandle()
    }
    this.animateGradient()
  }

  private onEnd = () => {
    console.log('onEnd listenWhenDone', this.listenWhenDone)
    this.setState({ playerSource: null }, () => {
      if (this.listenWhenDone) {
        this.listenWhenDone = false
        Spokestack.listen()
      } else {
        setTimeout(this.close, this.props.closeDelay)
      }
    })
  }

  private setCurrentHeight = ({ nativeEvent }: LayoutChangeEvent) => {
    this.currentHeight = nativeEvent.layout.height
  }

  private getMinimizedHeight() {
    const { insets, minimizedHeight } = this.props
    const height = minimizedHeight + (insets ? insets.bottom : 0)
    return height
  }

  private getOpenX() {
    const { buttonWidth, orientation } = this.props
    const closedXValue = buttonWidth / 2
    return orientation === 'left'
      ? this.windowWidth + closedXValue
      : -this.windowWidth - closedXValue
  }

  private getClosedX() {
    const { buttonWidth, orientation } = this.props
    const closedXValue = buttonWidth / 2
    return orientation === 'left' ? closedXValue : -closedXValue
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
    const { minHeight, noMinimized } = this.props
    return Math.min(
      Math.max(
        noMinimized ? minHeight : this.getMinimizedHeight(),
        this.startHeight - dy
      ),
      this.windowHeight
    )
  }

  private greet() {
    const { greet, handleIntent, onError, sayGreeting } = this.props
    const { silent } = this.state
    if (!greet) {
      return
    }
    const response = handleIntent('greet')
    if (response.prompt) {
      if (sayGreeting && !silent) {
        this.listenWhenDone = true
        this.say(response.prompt)
      } else {
        this.addBubble({ text: response.prompt, isLeft: true })
        Spokestack.listen()
      }
    } else {
      onError({
        type: Spokestack.ListenerType.ERROR,
        error: 'No prompt returned in the response'
      })
    }
  }

  private async opened() {
    const { greet } = this.props
    const { listening } = this.state
    // Could already be listening in response to wakeword
    if (listening) {
      return
    }
    if (greet) {
      this.greet()
    } else {
      Spokestack.listen()
    }
  }

  private async openOrClose(shouldOpen: boolean) {
    const { duration, easing, minHeight, noMinimized } = this.props
    const { listening, minimized } = this.state
    let animations: Animated.CompositeAnimation[] = []
    if (minimized) {
      shouldOpen = true
      animations.push(
        Animated.timing(this.height, {
          duration,
          easing,
          useNativeDriver: false,
          toValue: this.getMinimizedHeight()
        })
      )
    } else if (!noMinimized && this.currentHeight < minHeight) {
      animations.push(
        Animated.timing(this.height, {
          duration,
          easing,
          useNativeDriver: false,
          toValue: minHeight
        })
      )
    }
    if (!shouldOpen) {
      this.setState({ open: shouldOpen })
    }
    this.windowWidth = Dimensions.get('window').width
    ;([] as Animated.CompositeAnimation[]).push.apply(animations, [
      Animated.timing(this.panX, {
        duration,
        easing,
        useNativeDriver: false,
        toValue: shouldOpen ? this.getOpenX() : this.getClosedX()
      }),
      Animated.timing(this.shadowOpacity, {
        duration,
        easing,
        useNativeDriver: false,
        toValue: shouldOpen && !minimized ? 0.25 : 0
      })
    ])
    Animated.parallel(animations).start(() => {
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
        Spokestack.stopListening().then(Spokestack.start)
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
   * Minimize the tray so it only shows a bar at the bottom,
   * with no chat bubbles.
   * When listening, the gradient animates.
   * When not listening, the primary color shows.
   */
  minimize = async () => {
    const { noMinimized } = this.props
    if (noMinimized) {
      return
    }
    await setMinimized(true)
    this.setState({ minimized: true }, () => {
      this.openOrClose(true)
    })
  }

  /**
   * Return the tray to its normal, unminimized state.
   */
  unminimize = async () => {
    await setMinimized(false)
    this.setState({ minimized: false }, () => {
      this.openOrClose(true)
    })
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
      Spokestack.synthesize({
        input,
        format,
        voice
      })
        .then(({ url }) => {
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
      this.setState({ bubbles: bubbles.concat(bubble) })
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
      headerHeight,
      orientation,
      primaryColor,
      soundOnImage: soundOn,
      soundOffImage: soundOff,
      style
    } = this.props
    const {
      bubbles,
      listening,
      loading,
      minimized,
      open,
      playerSource,
      pressed,
      silent
    } = this.state
    const borderTopRadius = minimized ? 0 : 7
    const closedXValue = buttonWidth / 2
    const { width: deviceWidth } = Dimensions.get('window')
    const pressedColor = Color(primaryColor).darken(0.2).toString()
    return (
      <Animated.View
        onLayout={this.setCurrentHeight}
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
            height: this.height,
            transform: [{ translateX: this.panX }]
          }
        ]}
      >
        {!!playerSource && !silent && (open || minimized) && (
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
        {!open && !minimized && (
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
                backgroundColor: pressed ? pressedColor : primaryColor
              }
            ]}
            {...this.openPanResponder.panHandlers}
          >
            <Image source={micImage} style={styles.mic} />
          </View>
        )}
        <Animated.View
          style={[
            styles.content,
            {
              borderTopLeftRadius: borderTopRadius,
              borderTopRightRadius: borderTopRadius,
              borderWidth: minimized ? 0 : 1,
              shadowOpacity: this.shadowOpacity
            },
            style
          ]}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.innerContent}>
              <View
                style={[
                  styles.header,
                  {
                    backgroundColor: minimized
                      ? pressed
                        ? pressedColor
                        : primaryColor
                      : 'white',
                    borderTopLeftRadius: borderTopRadius,
                    borderTopRightRadius: borderTopRadius,
                    flexDirection:
                      orientation === 'left' ? 'row' : 'row-reverse',
                    height: minimized
                      ? this.getMinimizedHeight() + 1
                      : headerHeight
                  }
                ]}
              >
                <View
                  style={styles.resizer}
                  {...this.expandPanResponder.panHandlers}
                >
                  <View style={styles.touchbar} pointerEvents="none" />
                  <Animated.View
                    style={[
                      styles.gradientWrap,
                      {
                        height: minimized ? this.getMinimizedHeight() : 7,
                        opacity: listening ? 1 : 0,
                        transform: [
                          {
                            translateX: this.gradientAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, deviceWidth * 2]
                            })
                          }
                        ]
                      }
                    ]}
                  >
                    <LinearGradient
                      colors={gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ width: deviceWidth }}
                    />
                    <LinearGradient
                      colors={[...gradientColors].reverse()}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ width: deviceWidth }}
                    />
                    <LinearGradient
                      colors={gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ width: deviceWidth }}
                    />
                  </Animated.View>

                  {!minimized &&
                    (listening ? (
                      <Text style={[styles.listeningText, { fontFamily }]}>
                        LISTENING ...
                      </Text>
                    ) : (
                      loading && (
                        <Text style={[styles.listeningText, { fontFamily }]}>
                          LOADING ...
                        </Text>
                      )
                    ))}
                </View>
                {!minimized && (
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
                )}
                {!minimized && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.headerButton, styles.silentButton]}
                    onPress={this.toggleSilent}
                  >
                    {silent ? soundOff : soundOn}
                  </TouchableOpacity>
                )}
              </View>
              <SpeechBubbles
                backgroundSystem={Color(primaryColor).fade(0.9).toString()}
                bubbles={bubbles}
                bubbleTextStyle={{ fontFamily }}
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

export default function SpokestackTrayWithInsets(props: SpokestackTrayProps) {
  return (
    <SafeAreaProvider style={StyleSheet.absoluteFill}>
      <SafeAreaInsetsContext.Consumer>
        {(insets) => <SpokestackTray {...props} insets={insets} />}
      </SafeAreaInsetsContext.Consumer>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderColor: '#e7ebee',
    shadowColor: '#262226',
    shadowOffset: {
      width: 0,
      height: -1
    },
    shadowRadius: 20,
    elevation: 20
  },
  innerContent: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center'
  },
  header: {
    position: 'relative',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
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
    backgroundColor: 'transparent'
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
  listeningText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)'
  },
  gradientWrap: {
    position: 'absolute',
    top: -1,
    width: '300%',
    right: 0,
    flexDirection: 'row'
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
  buttonView: {
    position: 'absolute',
    top: 7,
    padding: 8,
    flexDirection: 'column',
    justifyContent: 'center'
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
    marginTop: 10
  },
  poweredImage: {
    width: 118,
    height: 16
  }
})
