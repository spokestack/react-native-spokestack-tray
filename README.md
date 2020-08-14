# react-native-spokestack-tray

A React Native component for adding Spokestack to any React Native app

## Installation

Install this library with the peer dependencies

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

A one-linear to install all dependencies

```sh
npm install react-native-spokestack-tray react-native-spokestack @react-native-community/async-storage @react-native-community/netinfo react-native-video rn-fetch-blob react-native-haptic-feedback react-native-linear-gradient react-native-permissions
```

Do not run `pod install` yet.

### Edit Podfile

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

Add the following to your Info.plist to enable permissions.

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

## Documentation

### Spokestack Functions

These functions are available as exports from react-native-spokestack-tray

##### listen

▸ **listen**(): _Promise‹boolean›_

_Defined in [src/Spokestack.ts:522](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/Spokestack.ts#L522)_

Tell Spokestack to start listening.
This will also open the tray.

```js
import { listen } from 'react-native-spokestack-tray

// ...

await listen()
```

**Returns:** _Promise‹boolean›_

---

##### isListening

▸ **isListening**(): _boolean_

_Defined in [src/Spokestack.ts:407](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/Spokestack.ts#L407)_

Returns whether Spokestack is currently listening with ASR

```js
import { isListening } from 'react-native-spokestack-tray'

if (isListening()) {
  // ...
}
```

**Returns:** _boolean_

---

### SpokestackTray Component Props

### `Optional` buttonWidth

• **buttonWidth**? : _number_ (Default: **60**)

_Defined in [src/SpokestackTray.tsx:71](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L71)_

Width (and height) of the mic button

### clientId

• **clientId**: _string_

_Defined in [src/SpokestackTray.tsx:54](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L54)_

Your Spokestack tokens generated in your Spokestack account
at https://spokestack.io/account.
Create an account for free then generate a token.

### clientSecret

• **clientSecret**: _string_

_Defined in [src/SpokestackTray.tsx:55](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L55)_

### `Optional` closeDelay

• **closeDelay**? : _number_ (Default: **0**)

_Defined in [src/SpokestackTray.tsx:73](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L73)_

How long to wait to close the tray after speaking (ms)

### `Optional` duration

• **duration**? : _number_ (Default: **500**)

_Defined in [src/SpokestackTray.tsx:75](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L75)_

Duration for the tray animation (ms)

### `Optional` easing

• **easing**? : _EasingFunction_ (Default: **Easing.bezier**)

_Defined in [src/SpokestackTray.tsx:77](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L77)_

Easing function for the tray animation

### `Optional` editTranscript

• **editTranscript**? : _function_

_Defined in [src/SpokestackTray.tsx:82](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L82)_

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

_Defined in [src/SpokestackTray.tsx:87](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L87)_

All nodes in this array should end
the conversation and close the tray

### `Optional` fontFamily

• **fontFamily**? : _string_

_Defined in [src/SpokestackTray.tsx:92](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L92)_

Font to use for "LISTENING...", "LOADING...",
and chat bubble text.

### `Optional` gradientColors

• **gradientColors**? : _string[]_

_Defined in [src/SpokestackTray.tsx:96](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L96)_

Colors for the linear gradient shown when listening

### `Optional` greet

• **greet**? : _boolean_ (Default: **false**)

_Defined in [src/SpokestackTray.tsx:102](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L102)_

Whether to greet the user with a welcome message
when the tray opens.
Default: false

### handleIntent

• **handleIntent**: _function_

_Defined in [src/SpokestackTray.tsx:65](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L65)_

This function takes an intent from the NLU
and returns an object with a unique conversation
node name (that you define) and a prompt
to be processed by TTS and spoken.

Note: the prompt is only shown in a chat bubble
if sound has been turned off.

#### Type declaration:

▸ (`intent`: string, `slots?`: any, `utterance?`: string): _IntentResult_

**Parameters:**

| Name         | Type   |
| ------------ | ------ |
| `intent`     | string |
| `slots?`     | any    |
| `utterance?` | string |

### `Optional` haptic

• **haptic**? : _boolean_ (Default: **true**)

_Defined in [src/SpokestackTray.tsx:103](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L103)_

### `Optional` minHeight

• **minHeight**? : _number_ (Default: **170**)

_Defined in [src/SpokestackTray.tsx:105](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L105)_

Minimum height for the tray

### `Optional` onClose

• **onClose**? : _function_

_Defined in [src/SpokestackTray.tsx:106](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L106)_

#### Type declaration:

▸ (): _void_

### `Optional` onError

• **onError**? : _function_

_Defined in [src/SpokestackTray.tsx:107](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L107)_

#### Type declaration:

▸ (`e`: ListenerEvent): _void_

**Parameters:**

| Name | Type          |
| ---- | ------------- |
| `e`  | ListenerEvent |

### `Optional` onOpen

• **onOpen**? : _function_

_Defined in [src/SpokestackTray.tsx:108](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L108)_

#### Type declaration:

▸ (): _void_

### `Optional` orientation

• **orientation**? : _"left" | "right"_

_Defined in [src/SpokestackTray.tsx:109](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L109)_

### `Optional` primaryColor

• **primaryColor**? : _string_ (Default: **"**)

_Defined in [src/SpokestackTray.tsx:110](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L110)_

### `Optional` sayGreeting

• **sayGreeting**? : _boolean_ (Default: **true**)

_Defined in [src/SpokestackTray.tsx:117](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L117)_

Whether to speak the greeting or only display
a chat bubble with the greet message,
even if sound is on.
Default: true

### `Optional` startHeight

• **startHeight**? : _number_ (Default: **220**)

_Defined in [src/SpokestackTray.tsx:119](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L119)_

Starting height for tray

### `Optional` style

• **style**? : _Animated.WithAnimatedValue‹StyleProp‹ViewStyle››_

_Defined in [src/SpokestackTray.tsx:120](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L120)_

### `Optional` ttsFormat

• **ttsFormat**? : _TTSFormat_ (Default: **TTSFormat.TEXT**)

_Defined in [src/SpokestackTray.tsx:121](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L121)_

### `Optional` voice

• **voice**? : _string_ (Default: **"demo-male"**)

_Defined in [src/SpokestackTray.tsx:123](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L123)_

A key for a voice in Spokestack ASR. Default: 'demo-male'

### SpokestackTray Component Methods

These methods are available from the SpokestackTray component. Use a React ref to access these methods.

```js
const spokestackTray = useRef(null)

  // ...
  <SpokestackTray ref={spokestackTray}

// ...
spokestackTray.current.say('Here is something for Spokestack to say')
```

**Note**: In most cases, you should call `listen` instead of `open`.

##### open

▸ **open**(): _void_

_Defined in [src/SpokestackTray.tsx:501](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L501)_

Open the tray, greet (if applicable), and listen

**Returns:** _void_

---

##### close

▸ **close**(): _void_

_Defined in [src/SpokestackTray.tsx:508](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L508)_

Close the tray, stop listening, and restart wakeword

**Returns:** _void_

---

##### say

▸ **say**(`input`: string): _Promise‹void›_

_Defined in [src/SpokestackTray.tsx:516](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L516)_

Passes the input to Spokestack.synthesize(),
plays the audio, and adds a speech bubble.

**Parameters:**

| Name    | Type   |
| ------- | ------ |
| `input` | string |

**Returns:** _Promise‹void›_

---

##### addBubble

▸ **addBubble**(`bubble`: Bubble): _void_

_Defined in [src/SpokestackTray.tsx:554](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L554)_

Add a bubble (system or user)
to the chat interface

**Parameters:**

| Name     | Type   |
| -------- | ------ |
| `bubble` | Bubble |

**Returns:** _void_

---

##### toggleSilent

▸ **toggleSilent**(): _Promise‹boolean›_

_Defined in [src/SpokestackTray.tsx:566](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L566)_

Toggle silent mode

**Returns:** _Promise‹boolean›_

##### isSilent

▸ **isSilent**(): _boolean_

_Defined in [src/SpokestackTray.tsx:578](https://github.com/spokestack/react-native-spokestack-tray/blob/e22c043/src/SpokestackTray.tsx#L578)_

Returns whether the tray is in silent mode

**Returns:** _boolean_

---

## License

MIT
