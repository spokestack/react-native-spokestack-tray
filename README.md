# react-native-spokestack-tray

A React Native component for adding Spokestack to any React Native app.

![Example app](./example/tray_example.gif)

## Installation

Install this library with the peer dependencies

A one-linear to install all dependencies

```sh
npm install react-native-spokestack-tray react-native-spokestack @react-native-community/async-storage @react-native-community/netinfo react-native-video rn-fetch-blob react-native-haptic-feedback react-native-linear-gradient react-native-permissions
```

Each dependency by its usage.

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

Our main dependency (react-native-spokestack) makes use of relatively new APIs only available in iOS 13+. Make sure to set your deployment target to iOS 13, and set the following

```ruby
platform :ios, '13.0'
```

We use [react-native-permissions](https://github.com/react-native-community/react-native-permissions) to check and request the Microphone permission (iOS and Android) and the Speech Recognition permission (iOS only). This library separates each permission into their own pod to avoid inflating your app with code you don't use. Add the following pods to your Podfile...

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

For the time-being, `use_frameworks!` does not work with Flipper, so we also need to disable Flipper. Remove any Flipper-related lines in your Podfile. In React Native 0.63.2, they look like this...

```ruby
  # X Remove or comment out these lines X
  use_flipper!
  post_install do |installer|
    flipper_post_install(installer)
  end
  # XX
```

Remove your existing Podfile.lock and Pods folder to ensure no conflicts, then install the pods...

```sh
$ npx pod-install
```

Refer to the [Podfile in our example](https://github.com/spokestack/react-native-spokestack-tray/blob/develop/example/ios/Podfile) for a working Podfile.

### Edit Info.plist

Add the following to your Info.plist to enable permissions. Also ensure your iOS deployment target is set to 13.0.

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

Set the AudioSession category, to enable microphone input and play out of the speaker by default. This also enables input and playback over bluetooth.

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

While Flipper works on fixing their pod for `use_frameworks!`, we must disable Flipper in the meantime. We already removed the Flipper dependencies from Pods above, but there remains some code in the AppDelegate.m that imports Flipper. There are two ways to fix this.

1. You can disable Flipper imports without removing any code from the AppDelegate. To do this, open your xcworkspace file in XCode. Go to your target, then Build Settings, search for "C Flags", remove `-DFB_SONARKIT_ENABLED=1` from flags.
1. Remove all Flipper-related code from your AppDelegate.m.

In our example app, we've done option 1 and left in the Flipper code in case they get it working in the future and we can add it back.

## Android installation

### Edit app/build.gradle

Add the following lines

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
    />
  )
}
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

---

# Documentation

## Spokestack Functions

These functions are available as exports from react-native-spokestack-tray

---

### listen

▸ **listen**(): _Promise‹boolean›_

_Defined in [src/Spokestack.ts:591](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/Spokestack.ts#L591)_

Tell Spokestack to start listening.
This will also open the tray.

```js
import { listen } from 'react-native-spokestack-tray'

// ...

await listen()
```

**Returns:** _Promise‹boolean›_

---

### stopListening

▸ **stopListening**(): _Promise‹boolean›_

_Defined in [src/Spokestack.ts:611](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/Spokestack.ts#L611)_

Tell Spokestack to stop listening with ASR.

```js
import { stopListening } from 'react-native-spokestack-tray

// ...

stopListening()
```

**Returns:** _Promise‹boolean›_

---

### isListening

▸ **isListening**(): _boolean_

_Defined in [src/Spokestack.ts:475](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/Spokestack.ts#L475)_

Returns whether Spokestack is currently listening with ASR

```js
import { isListening } from 'react-native-spokestack-tray'

if (isListening()) {
  // ...
}
```

**Returns:** _boolean_

---

## `<SpokestackTray />` Component Props

### `Optional` buttonWidth

• **buttonWidth**? : _number_ (Default: **60**)

_Defined in [src/SpokestackTray.tsx:90](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L90)_

Width (and height) of the mic button

### clientId

• **clientId**: _string_

_Defined in [src/SpokestackTray.tsx:55](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L55)_

Your Spokestack tokens generated in your Spokestack account
at https://spokestack.io/account.
Create an account for free then generate a token.
This is from the "ID" field.

### clientSecret

• **clientSecret**: _string_

_Defined in [src/SpokestackTray.tsx:62](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L62)_

Your Spokestack tokens generated in your Spokestack account
at https://spokestack.io/account.
Create an account for free then generate a token.
This is from the "secret" field.

### `Optional` closeDelay

• **closeDelay**? : _number_ (Default: **0**)

_Defined in [src/SpokestackTray.tsx:92](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L92)_

How long to wait to close the tray after speaking (ms)

### `Optional` duration

• **duration**? : _number_ (Default: **500**)

_Defined in [src/SpokestackTray.tsx:94](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L94)_

Duration for the tray animation (ms)

### `Optional` easing

• **easing**? : _EasingFunction_ (Default: **Easing.bezier**)

_Defined in [src/SpokestackTray.tsx:96](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L96)_

Easing function for the tray animation

### `Optional` editTranscript

• **editTranscript**? : _function_

_Defined in [src/SpokestackTray.tsx:101](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L101)_

Edit the transcript before classification
and before the user response bubble is shown.

#### Type declaration:

▸ (`transcript`: string): _string_

**Parameters:**

| Name         | Type   |
| ------------ | ------ |
| `transcript` | string |

### `Optional` exitNodes

• **exitNodes**? : _string[]_

_Defined in [src/SpokestackTray.tsx:106](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L106)_

All nodes in this array should end
the conversation and close the tray

### `Optional` fontFamily

• **fontFamily**? : _string_

_Defined in [src/SpokestackTray.tsx:111](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L111)_

Font to use for "LISTENING...", "LOADING...",
and chat bubble text.

### `Optional` gradientColors

• **gradientColors**? : _string[]_

_Defined in [src/SpokestackTray.tsx:115](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L115)_

Colors for the linear gradient shown when listening

### `Optional` greet

• **greet**? : _boolean_ (Default: **false**)

_Defined in [src/SpokestackTray.tsx:121](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L121)_

Whether to greet the user with a welcome message
when the tray opens.
Default: false

### handleIntent

• **handleIntent**: _function_

_Defined in [src/SpokestackTray.tsx:72](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L72)_

This function takes an intent from the NLU
and returns an object with a unique conversation
node name (that you define) and a prompt
to be processed by TTS and spoken.

Note: the prompt is only shown in a chat bubble
if sound has been turned off.

#### Type declaration:

▸ (`intent`: string, `slots?`: any, `utterance?`: string): _[IntentResult](#IntentResult)_

**Parameters:**

| Name         | Type   |
| ------------ | ------ |
| `intent`     | string |
| `slots?`     | any    |
| `utterance?` | string |

### `Optional` haptic

• **haptic**? : _boolean_ (Default: **true**)

_Defined in [src/SpokestackTray.tsx:126](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L126)_

Set this to false to disable the haptic
that gets played whenever the tray starts listening.

### `Optional` minHeight

• **minHeight**? : _number_ (Default: **170**)

_Defined in [src/SpokestackTray.tsx:128](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L128)_

Minimum height for the tray

### `Optional` nluModelUrls

• **nluModelUrls**? : _object_

_Defined in [src/SpokestackTray.tsx:136](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L136)_

The URLs of your NLU model files.
These models will be automatically downloaded
the first time the app opens, and then saved.
This is required for the NLU to work.
See https://spokestack.io/docs/Concepts/nlu

#### Type declaration:

- **metadata**: _string_

- **nlu**: _string_

- **vocab**: _string_

### `Optional` onClose

• **onClose**? : _function_

_Defined in [src/SpokestackTray.tsx:144](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L144)_

Called whenever the tray has closed

#### Type declaration:

▸ (): _void_

### `Optional` onError

• **onError**? : _function_

_Defined in [src/SpokestackTray.tsx:146](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L146)_

Called whenever there's an error from Spokestack

#### Type declaration:

▸ (`e`: [ListenerEvent](#ListenerEvent)): _void_

**Parameters:**

| Name | Type                            |
| ---- | ------------------------------- |
| `e`  | [ListenerEvent](#ListenerEvent) |

### `Optional` onOpen

• **onOpen**? : _function_

_Defined in [src/SpokestackTray.tsx:148](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L148)_

Called whenever the tray has opened

#### Type declaration:

▸ (): _void_

### `Optional` orientation

• **orientation**? : _"left" | "right"_

_Defined in [src/SpokestackTray.tsx:152](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L152)_

The tray button can be oriented on either side of the screen

### `Optional` primaryColor

• **primaryColor**? : _string_ (Default: **"**)

_Defined in [src/SpokestackTray.tsx:157](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L157)_

This color is used to theme the tray
and is used in the mic button and speech bubbles.

### `Optional` refreshModels

• **refreshModels**? : _boolean_

_Defined in [src/SpokestackTray.tsx:164](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L164)_

Use this sparingly to refresh the
wakeword and NLU models on device
(force overwrite).
`<SpokestackTray refreshModels={process.env.NODE_ENV !== 'production'} ... />`

### `Optional` sayGreeting

• **sayGreeting**? : _boolean_ (Default: **true**)

_Defined in [src/SpokestackTray.tsx:171](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L171)_

Whether to speak the greeting or only display
a chat bubble with the greet message,
even if sound is on.
Default: true

### `Optional` soundOffImage

• **soundOffImage**? : _React.ReactNode_

_Defined in [src/SpokestackTray.tsx:175](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L175)_

Replace the sound off image by passing an <Image />

### `Optional` soundOnImage

• **soundOnImage**? : _React.ReactNode_

_Defined in [src/SpokestackTray.tsx:173](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L173)_

Replace the sound on image by passing an <Image />

### `Optional` startHeight

• **startHeight**? : _number_ (Default: **220**)

_Defined in [src/SpokestackTray.tsx:177](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L177)_

Starting height for tray

### `Optional` style

• **style**? : _Animated.WithAnimatedValue‹StyleProp‹ViewStyle››_

_Defined in [src/SpokestackTray.tsx:179](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L179)_

This style prop is passed to the tray's container

### `Optional` ttsFormat

• **ttsFormat**? : _TTSFormat_ (Default: **TTSFormat.TEXT**)

_Defined in [src/SpokestackTray.tsx:181](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L181)_

The format for the text passed to Spokestack.synthesize

### `Optional` voice

• **voice**? : _string_ (Default: **"demo-male"**)

_Defined in [src/SpokestackTray.tsx:183](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L183)_

A key for a voice in Spokestack ASR, passed to Spokestack.synthesize

### wakewordModelUrls

• **wakewordModelUrls**: _object_

_Defined in [src/SpokestackTray.tsx:84](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L84)_

The URLs of your wakeword model files.
These models will be automatically downloaded
the first time the app opens, and then saved.
This is required for wakeword to work.
See https://spokestack.io/docs/Concepts/wakeword-models

#### Type declaration:

- **detect**: _string_

- **encode**: _string_

- **filter**: _string_

---

#### `IntentResult`

IntentResult is the expected return type of `handleIntent`.

**data**? : _any_

**node**: _string_

**prompt**: _string_

---

#### `ListenerEvent`

ListenerEvent is passed to some callbacks. Usually, only `type` and one other property is defined, depending on the context.

**error**? : _string_

**message**? : _string_

**result**? : _object_

**confidence**: _number_

**intent**: _string_

**transcript**? : _string_

**type**: _ListenerType_

**url**? : _string_

---

#### `ListenerType` enum

`ListenerType` is used in `ListenerEvent`

**ACTIVATE**: = "activate"

**CHANGE**: = "change"

**CLASSIFICATION**: = "classification"

**DEACTIVATE**: = "deactivate"

**ERROR**: = "error"

**INIT**: = "init"

**RECOGNIZE**: = "recognize"

**START**: = "start"

**STOP**: = "stop"

**SUCCESS**: = "success"

**TIMEOUT**: = "timeout"

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

▸ **open**(): _void_

_Defined in [src/SpokestackTray.tsx:578](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L578)_

Open the tray, greet (if applicable), and listen

**Returns:** _void_

---

### close

▸ **close**(): _void_

_Defined in [src/SpokestackTray.tsx:585](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L585)_

Close the tray, stop listening, and restart wakeword

**Returns:** _void_

---

### say

▸ **say**(`input`: string): _Promise‹void›_

_Defined in [src/SpokestackTray.tsx:593](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L593)_

Passes the input to Spokestack.synthesize(),
plays the audio, and adds a speech bubble.

**Parameters:**

| Name    | Type   |
| ------- | ------ |
| `input` | string |

**Returns:** _Promise‹void›_

---

### addBubble

▸ **addBubble**(`bubble`: Bubble): _void_

_Defined in [src/SpokestackTray.tsx:631](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L631)_

Add a bubble (system or user)
to the chat interface

**Parameters:**

| Name     | Type   |
| -------- | ------ |
| `bubble` | Bubble |

**Returns:** _void_

#### `Bubble`

**isLeft**: _boolean_

**text**: _string_

---

### toggleSilent

▸ **toggleSilent**(): _Promise‹boolean›_

_Defined in [src/SpokestackTray.tsx:643](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L643)_

Toggle silent mode

**Returns:** _Promise‹boolean›_

---

### isSilent

▸ **isSilent**(): _boolean_

_Defined in [src/SpokestackTray.tsx:655](https://github.com/spokestack/react-native-spokestack-tray/blob/59ce3e9/src/SpokestackTray.tsx#L655)_

Returns whether the tray is in silent mode

**Returns:** _boolean_

---

## License

MIT
