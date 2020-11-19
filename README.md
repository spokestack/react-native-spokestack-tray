# react-native-spokestack-tray

A React Native component for adding Spokestack to any React Native app.

![Example app](./example/tray_example.gif)

## Installation

Install this library with the peer dependencies

A one-liner to install all dependencies

```sh
npm install react-native-spokestack-tray react-native-spokestack @react-native-community/async-storage @react-native-community/netinfo react-native-video rn-fetch-blob react-native-haptic-feedback react-native-linear-gradient react-native-permissions
```

### Each dependency by its usage.

```sh
$ npm install react-native-spokestack-tray react-native-spokestack

# Used for storing a simple boolean to turn on/off sound
$ npm install @react-native-community/async-storage

# Used to check the network status before downloading model files
$ npm install @react-native-community/netinfo

# Used to play TTS audio prompts.
# Despite its name, we think this is one of the best
# plugins (if not the best) for playing audio.
# In iOS, Audio and Video are intertwined.
$ npm install react-native-video

# Used to download model files and persist them to storage
# so they only need to be downloaded once.
$ npm install rn-fetch-blob

# Used to show an animating gradient when Spokestack listens
$ npm install react-native-linear-gradient

# Used to check microphone and speech recognition permissions
$ npm install react-native-permissions

# Used to generate a haptic whenever Spokestack listens.
# This can be turned off, but the dependency is still needed.
$ npm install react-native-haptic-feedback
```

Do not run `pod install` yet.

## iOS installation

### Edit Podfile

Our main dependency (react-native-spokestack) makes use of relatively new APIs only available in iOS 13+. Make sure to set your deployment target to iOS 13 at the top of your Podfile:

```ruby
platform :ios, '13.0'
```

We use [react-native-permissions](https://github.com/react-native-community/react-native-permissions) to check and request the Microphone permission (iOS and Android) and the Speech Recognition permission (iOS only). This library separates each permission into its own pod to avoid inflating your app with code you don't use. Add the following pods to your Podfile:

```ruby
target 'SpokestackTrayExample' do
  # ...
  permissions_path = '../node_modules/react-native-permissions/ios'
  pod 'Permission-Microphone', :path => "#{permissions_path}/Microphone.podspec"
  pod 'Permission-SpeechRecognition', :path => "#{permissions_path}/SpeechRecognition.podspec"
```

We need to use `use_frameworks!` in our Podfile because a couple of our dependencies are written using Swift.

```ruby
target 'SpokestackTrayExample' do
  use_frameworks!
  #...
```

For the time being, `use_frameworks!` does not work with Flipper, so we also need to disable Flipper. Remove any Flipper-related lines in your Podfile. In React Native 0.63.2, they look like this:

```ruby
  # X Remove or comment out these lines X
  use_flipper!
  post_install do |installer|
    flipper_post_install(installer)
  end
  # XX
```

Remove your existing Podfile.lock and Pods folder to ensure no conflicts, then install the pods:

```sh
$ npx pod-install
```

Refer to the [Podfile in our example](https://github.com/spokestack/react-native-spokestack-tray/blob/develop/example/ios/Podfile) for a working Podfile.

### Edit Info.plist

Add the following to your Info.plist to enable permissions. In XCode, also ensure your iOS deployment target is set to 13.0 or higher.

```
<key>NSMicrophoneUsageDescription</key>
<string>This app uses the microphone to hear voice commands</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>This app uses speech recognition to process voice commands</string>
```

### Edit AppDelegate.m

#### Add AVFoundation to imports

```objc
#import <AVFoundation/AVFoundation.h>
```

#### AudioSession category

Set the AudioSession category, to enable microphone input and play from the speaker by default. This also enables input and playback over bluetooth.

```objc
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  AVAudioSession *session = [AVAudioSession sharedInstance];
  [session setCategory:AVAudioSessionCategoryPlayAndRecord
     mode:AVAudioSessionModeDefault
  options:AVAudioSessionCategoryOptionDefaultToSpeaker | AVAudioSessionCategoryOptionAllowAirPlay | AVAudioSessionCategoryOptionAllowBluetoothA2DP | AVAudioSessionCategoryOptionAllowBluetooth
    error:nil];
  [session setActive:YES error:nil];

  // ...
```

#### Remove Flipper

While Flipper works on fixing their pod for `use_frameworks!`, we must disable Flipper. We already removed the Flipper dependencies from Pods above, but there remains some code in the AppDelegate.m that imports Flipper. There are two ways to fix this.

1. You can disable Flipper imports without removing any code from the AppDelegate. To do this, open your xcworkspace file in XCode. Go to your target, then Build Settings, search for "C Flags", remove `-DFB_SONARKIT_ENABLED=1` from flags.
1. Remove all Flipper-related code from your AppDelegate.m.

In our example app, we've done option 1 and left in the Flipper code in case they get it working in the future and we can add it back.

## Android installation

### Edit AndroidManifest.xml

```xml
    <!-- For TTS -->
    <uses-permission android:name="android.permission.INTERNET" />
    <!-- For wakeword and ASR -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### Edit app/build.gradle

Add the following lines:

```java
android {
    // ...
    defaultConfig {
        // ...
        multiDexEnabled true
    }
    // ...
    packagingOptions {
        exclude 'META-INF/INDEX.LIST'
        exclude 'META-INF/DEPENDENCIES'
    }
}
```

## Usage

```js
import SpokestackTray, { listen } from 'react-native-spokestack-tray'

// ...

export default function ConversationHandler({ navigation }) {
  return (
    <SpokestackTray
      clientId={process.env.SPOKESTACK_CLIENT_ID}
      clientSecret={process.env.SPOKESTACK_CLIENT_SECRET}
      handleIntent={(intent, slots, utterance) => {
        switch (intent) {
          // These cases would be for all
          // the possible intents defined in your NLU.
          case 'request.select':
            // As an example, search with some service
            // with the given value from the NLU
            const recipe = SearchService.find(slots.recipe?.value)
            // An example of navigating to some scene to show
            // data, a recipe in our example.
            navigation.navigate('Recipe', { recipe })
            return {
              node: 'info.recipe',
              prompt: 'We found your recipe!'
            }
          default:
            return {
              node: 'welcome',
              prompt: 'Let us help you find a recipe.'
            }
        }
      }}
      // The NLU models are downloaded once
      // when the app is first installed.
      // See https://spokestack.io/docs/Concepts/nlu
      // for descriptions of these files.
      nluModelUrls={{
        // These files can made manually or
        // exported from existing Alexa, Dialogflow, or
        // Jovo models.
        nlu: 'https://somecdn/nlu.tflite',
        vocab: 'https://somecdn/vocab.txt',
        metadata: 'https://somecdn/metadata.json'
      }}
    />
  )
}
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

---

# Documentation

## `<SpokestackTray />` Component Props

### buttonWidth

• `Optional` **buttonWidth**: number (Default: **60**)

_Defined in [src/SpokestackTray.tsx:107](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L107)_

Width (and height) of the mic button

### clientId

• **clientId**: string

_Defined in [src/SpokestackTray.tsx:72](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L72)_

Your Spokestack tokens generated in your Spokestack account
at https://spokestack.io/account.
Create an account for free then generate a token.
This is from the "ID" field.

### clientSecret

• **clientSecret**: string

_Defined in [src/SpokestackTray.tsx:79](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L79)_

Your Spokestack tokens generated in your Spokestack account
at https://spokestack.io/account.
Create an account for free then generate a token.
This is from the "secret" field.

### closeDelay

• `Optional` **closeDelay**: number (Default: **0**)

_Defined in [src/SpokestackTray.tsx:109](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L109)_

How long to wait to close the tray after speaking (ms)

### debug

• `Optional` **debug**: boolean

_Defined in [src/SpokestackTray.tsx:111](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L111)_

Show debug messages from react-native-spokestack

### duration

• `Optional` **duration**: number (Default: **500**)

_Defined in [src/SpokestackTray.tsx:113](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L113)_

Duration for the tray animation (ms)

### easing

• `Optional` **easing**: EasingFunction (Default: **Easing.bezier(0.77, 0.41, 0.2, 0.84)**)

_Defined in [src/SpokestackTray.tsx:115](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L115)_

Easing function for the tray animation

### editTranscript

• `Optional` **editTranscript**: (transcript: string) => string

_Defined in [src/SpokestackTray.tsx:120](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L120)_

Edit the transcript before classification
and before the user response bubble is shown.

### exitNodes

• `Optional` **exitNodes**: string[]

_Defined in [src/SpokestackTray.tsx:125](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L125)_

All nodes in this array should end
the conversation and close the tray

### fontFamily

• `Optional` **fontFamily**: string

_Defined in [src/SpokestackTray.tsx:130](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L130)_

Font to use for "LISTENING...", "LOADING...",
and chat bubble text.

### gradientColors

• `Optional` **gradientColors**: string[] (Default: **['#61fae9', '#2F5BEA']**)

_Defined in [src/SpokestackTray.tsx:135](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L135)_

Colors for the linear gradient shown when listening
Can be any number of colors (recommended: 2-3)

### greet

• `Optional` **greet**: boolean (Default: **false**)

_Defined in [src/SpokestackTray.tsx:141](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L141)_

Whether to greet the user with a welcome message
when the tray opens.
Note: `handleIntent` must respond to the "greet" intent.

### handleIntent

• **handleIntent**: (intent: string, slots?: any, utterance?: string) => [IntentResult](#IntentResult)

_Defined in [src/SpokestackTray.tsx:89](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L89)_

This function takes an intent from the NLU
and returns an object with a unique conversation
node name (that you define) and a prompt
to be processed by TTS and spoken.

Note: the prompt is only shown in a chat bubble
if sound has been turned off.

### haptic

• `Optional` **haptic**: boolean (Default: **true**)

_Defined in [src/SpokestackTray.tsx:146](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L146)_

Set this to false to disable the haptic
that gets played whenever the tray starts listening.

### minHeight

• `Optional` **minHeight**: number (Default: **170**)

_Defined in [src/SpokestackTray.tsx:148](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L148)_

Minimum height for the tray

### nluModelUrls

• **nluModelUrls**: { metadata: string ; nlu: string ; vocab: string }

_Defined in [src/SpokestackTray.tsx:101](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L101)_

The URLs of your NLU model files.
These models will be automatically downloaded
the first time the app opens, and then saved.
This is required for the NLU to work.
See https://spokestack.io/docs/Concepts/nlu

#### Type declaration:

| Name       | Type   |
| ---------- | ------ |
| `metadata` | string |
| `nlu`      | string |
| `vocab`    | string |

### onClose

• `Optional` **onClose**: () => void

_Defined in [src/SpokestackTray.tsx:152](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L152)_

Called whenever the tray has closed

### onError

• `Optional` **onError**: (e: [ListenerEvent](#ListenerEvent)) => void

_Defined in [src/SpokestackTray.tsx:154](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L154)_

Called whenever there's an error from Spokestack

### onOpen

• `Optional` **onOpen**: () => void

_Defined in [src/SpokestackTray.tsx:156](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L156)_

Called whenever the tray has opened

### orientation

• `Optional` **orientation**: \"left\" \| \"right\" (Default: **"left"**)

_Defined in [src/SpokestackTray.tsx:160](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L160)_

The tray button can be oriented on either side of the screen

### primaryColor

• `Optional` **primaryColor**: string (Default: **"#2f5bea"**)

_Defined in [src/SpokestackTray.tsx:165](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L165)_

This color is used to theme the tray
and is used in the mic button and speech bubbles.

### profile

• `Optional` **profile**: PipelineProfile

_Defined in [src/SpokestackTray.tsx:182](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L182)_

The Spokestack config profile to pass to
react-native-spokestack.
These are available from react-native-spokestack
starting in version 4.0.0.

```js
import SpokestackTray from 'react-native-spokestack-tray'
import { PipelineProfile } from 'react-native-spokestack'

// ...
<SpokestackTray
 profile={PipelineProfile.TFLITE_WAKEWORD_SPOKESTACK_ASR}
// ...
```

### refreshModels

• `Optional` **refreshModels**: boolean

_Defined in [src/SpokestackTray.tsx:189](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L189)_

Use this sparingly to refresh the
wakeword and NLU models on device
(force overwrite).
`<SpokestackTray refreshModels={process.env.NODE_ENV !== 'production'} ... />`

### sayGreeting

• `Optional` **sayGreeting**: boolean (Default: **true**)

_Defined in [src/SpokestackTray.tsx:195](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L195)_

Whether to speak the greeting or only display
a chat bubble with the greet message,
even if sound is on.

### soundOffImage

• `Optional` **soundOffImage**: React.ReactNode (Default: **( \<Image source={soundOffImage} style={{ width: 30, height: 30 }} /> )**)

_Defined in [src/SpokestackTray.tsx:199](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L199)_

Replace the sound off image by passing an <Image />

### soundOnImage

• `Optional` **soundOnImage**: React.ReactNode (Default: **( \<Image source={soundOnImage} style={{ width: 30, height: 30 }} /> )**)

_Defined in [src/SpokestackTray.tsx:197](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L197)_

Replace the sound on image by passing an <Image />

### spokestackConfig

• `Optional` **spokestackConfig**: Partial\<SpokestackConfig>

_Defined in [src/SpokestackTray.tsx:206](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L206)_

Pass options directly to the Spokestack.initialize()
function from react-native-spokestack.
See https://www.spokestack.io/docs/React%20Native/getting-started#configuring-spokestack
for available options.

### startHeight

• `Optional` **startHeight**: number (Default: **220**)

_Defined in [src/SpokestackTray.tsx:208](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L208)_

Starting height for tray

### style

• `Optional` **style**: Animated.WithAnimatedValue\<StyleProp\<ViewStyle>>

_Defined in [src/SpokestackTray.tsx:210](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L210)_

This style prop is passed to the tray's container

### ttsFormat

• `Optional` **ttsFormat**: TTSFormat (Default: **TTSFormat.TEXT**)

_Defined in [src/SpokestackTray.tsx:212](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L212)_

The format for the text passed to Spokestack.synthesize

### voice

• `Optional` **voice**: string (Default: **"demo-male"**)

_Defined in [src/SpokestackTray.tsx:214](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L214)_

A key for a voice in Spokestack ASR, passed to Spokestack.synthesize

### wakewordModelUrls

• `Optional` **wakewordModelUrls**: { detect: string ; encode: string ; filter: string }

_Defined in [src/SpokestackTray.tsx:223](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L223)_

The URLs of your wakeword model files.
These models will be automatically downloaded
the first time the app opens, and then saved.
If no URLs are provided, the tray will default to
the "Spokestack" wakeword.
See https://spokestack.io/docs/Concepts/wakeword-models

#### Type declaration:

| Name     | Type   |
| -------- | ------ |
| `detect` | string |
| `encode` | string |
| `filter` | string |

---

#### `IntentResult`

IntentResult is the expected return type of `handleIntent`.

`Optional` **data**: any

`Optional` **noInterrupt**: boolean

**node**: string

**prompt**: string

---

#### `SpokestackListenerEvent`

SpokestackListenerEvent is passed to some callbacks. Usually, only `type` and one other property is defined, depending on the context.

`Optional` **error**: string

`Optional` **message**: string

`Optional` **result**: { confidence: number ; intent: string ; slots: NLUSlot] }

`Optional` **transcript**: string

**type**: ListenerType

`Optional` **url**: string

---

#### `SpokestackListenerType` enum

`SpokestackListenerType` is used in `SpokestackListenerEvent`

**ACTIVATE** = "activate"

**CHANGE** = "change"

**CLASSIFICATION** = "classification"

**DEACTIVATE** = "deactivate"

**ERROR** = "error"

**INIT** = "init"

**RECOGNIZE** = "recognize"

**START** = "start"

**STOP** = "stop"

**SUCCESS** = "success"

**TIMEOUT** = "timeout"

---

## `<SpokestackTray />` Component Methods

These methods are available from the SpokestackTray component. Use a React ref to access these methods.

```js
const spokestackTray = useRef(null)

  // ...
  <SpokestackTray ref={spokestackTray}

// ...
spokestackTray.current.say('Here is something for Spokestack to say')
```

**Note**: In most cases, you should call `listen` instead of `open`.

---

### open

▸ **open**(): void

_Defined in [src/SpokestackTray.tsx:608](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L608)_

Open the tray, greet (if applicable), and listen

**Returns:** void

---

### close

▸ **close**(): void

_Defined in [src/SpokestackTray.tsx:619](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L619)_

Close the tray, stop listening, and restart wakeword

**Returns:** void

---

### say

▸ **say**(`input`: string): Promise\<void>

_Defined in [src/SpokestackTray.tsx:631](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L631)_

Passes the input to Spokestack.synthesize(),
plays the audio, and adds a speech bubble.

---

### addBubble

▸ **addBubble**(`bubble`: Bubble): void

_Defined in [src/SpokestackTray.tsx:669](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L669)_

Add a bubble (system or user)
to the chat interface

#### `Bubble`

**isLeft**: boolean

**text**: string

---

### toggleSilent

▸ **toggleSilent**(): Promise\<boolean>

_Defined in [src/SpokestackTray.tsx:686](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L686)_

Toggle silent mode

**Returns:** Promise\<boolean>

---

### isSilent

▸ **isSilent**(): boolean

_Defined in [src/SpokestackTray.tsx:698](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/SpokestackTray.tsx#L698)_

Returns whether the tray is in silent mode

**Returns:** boolean

---

## Spokestack Functions

These functions are available as exports from react-native-spokestack-tray

---

### listen

▸ **listen**(): Promise\<boolean>

_Defined in [src/Spokestack.ts:534](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/Spokestack.ts#L534)_

Tell Spokestack to start listening.
This will also open the tray.

```js
import { listen } from 'react-native-spokestack-tray'

// ...

await listen()
```

**Returns:** Promise\<boolean>

---

### stopListening

▸ **stopListening**(): Promise\<boolean>

_Defined in [src/Spokestack.ts:554](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/Spokestack.ts#L554)_

Tell Spokestack to stop listening with ASR.

```js
import { stopListening } from 'react-native-spokestack-tray'

// ...

stopListening()
```

**Returns:** Promise\<boolean>

---

### isListening

▸ **isListening**(): boolean

_Defined in [src/Spokestack.ts:629](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/Spokestack.ts#L629)_

Returns whether Spokestack is currently listening with ASR

```js
import { isListening } from 'react-native-spokestack-tray'

if (isListening()) {
  // ...
}
```

**Returns:** boolean

---

### isStarted

▸ **isStarted**(): boolean

_Defined in [src/Spokestack.ts:614](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/Spokestack.ts#L614)_

Returns whether Spokestack has started the speech pipeline.
The tray starts the pipeline when mounted, but this is
an async process.

```js
import { isStarted } from 'react-native-spokestack-tray'

if (isStarted()) {
  // ...
}
```

**Returns:** boolean

---

### isInitialized

▸ **isInitialized**(): boolean

_Defined in [src/Spokestack.ts:597](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/Spokestack.ts#L597)_

Returns whether Spokestack has been initialized.
The tray initializes Spokestack on mount, but is an
async process.

```js
import { isInitialized } from 'react-native-spokestack-tray'

if (isInitialized()) {
  // ...
}
```

**Returns:** boolean

---

### addListener

▸ **addListener**(`type`: ListenerType, `fn`: Listener): void

_Defined in [src/Spokestack.ts:73](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/Spokestack.ts#L73)_

Add a Spokestack listener to any of Spokestack's events

```js
import {
  addListener,
  SpokestackListenerType
} from 'react-native-spokestack-tray'

// ...
function initialized() {
  console.log('Spokestack initialized')
}
addListener(SpokestackListenerType.INIT, initialized)
```

---

### removeListener

▸ **removeListener**(`type`: ListenerType, `fn`: Listener): void

_Defined in [src/Spokestack.ts:90](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/Spokestack.ts#L90)_

Remove a Spokestack listener

```js
import {
  removeListener,
  SpokestackListenerType
} from 'react-native-spokestack-tray'

// ...
removeListener(SpokestackListenerType.INIT, initialized)
```

---

### addListenerOnce

▸ **addListenerOnce**(`type`: ListenerType, `fn`: Listener): void

_Defined in [src/Spokestack.ts:110](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/Spokestack.ts#L110)_

Adds a Spokestack listener to any of Spokestack's events
to be removed the first time it runs.

```js
import {
  addListenerOnce,
  SpokestackListenerType
} from 'react-native-spokestack-tray'

// ...
addListenerOnce(SpokestackListenerType.INIT, () => {
  console.log('Spokestack initialized')
})
```

## Checking speech permissions

These utility functions are used by Spokestack to check microphone permission on iOS and Android and speech recognition permission on iOS.

---

### checkSpeech

▸ **checkSpeech**(): Promise\<boolean>

_Defined in [src/utils/permissions.ts:78](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/utils/permissions.ts#L78)_

This function can be used to check whether the user has given
the necessary permission for speech.
On iOS, this includes both microphone and speech recnogition.
On Android, only the microphone is needed.

```js
import { checkSpeech } from 'react-native-spokestack-tray'

// ...

const hasPermission = await checkSpeech()
```

**Returns:** Promise\<boolean>

---

### requestSpeech

▸ **requestSpeech**(): Promise\<boolean>

_Defined in [src/utils/permissions.ts:109](https://github.com/spokestack/react-native-spokestack-tray/blob/1dfdd08/src/utils/permissions.ts#L109)_

This function can be used to actually request
the necessary permission for speech.
On iOS, this includes both microphone and speech recnogition.
On Android, only the microphone is needed.

Note: if the user has declined in the past on iOS,
the user must be sent to Settings.

```js
import { requestSpeech } from 'react-native-spokestack-tray'

// ...

const hasPermission = await requestSpeech()
```

**Returns:** Promise\<boolean>

---

## License

MIT
