<a href="https://www.spokestack.io/blog/integrating-spokestack-in-react-native" title="Integrating Spokestack in React Native">![React Native Spokestack Tray](./example/react-native-spokestsack-tray.png)</a>

A React Native component for adding Spokestack to any React Native app.

![Example app](./example/tray_example.gif)

## Installation

Install this library with the peer dependencies

A one-liner to install all dependencies

```sh
npm install react-native-spokestack-tray react-native-spokestack @react-native-community/async-storage react-native-video react-native-haptic-feedback react-native-linear-gradient react-native-permissions
```

### Each dependency by its usage.

```sh
$ npm install react-native-spokestack-tray react-native-spokestack

# Used for storing a simple boolean to turn on/off sound
$ npm install @react-native-community/async-storage

# Used to play TTS audio prompts.
# Despite its name, we think this is one of the best
# plugins (if not the best) for playing audio.
# In iOS, Audio and Video are intertwined anyway.
$ npm install react-native-video

# Used to show an animating gradient when Spokestack listens
$ npm install react-native-linear-gradient

# Used to check microphone and speech recognition permissions
$ npm install react-native-permissions

# Used to generate a haptic whenever Spokestack listens.
# This can be turned off, but the dependency is still needed.
$ npm install react-native-haptic-feedback
```

Then follow the instructions for each platform to link react-native-spokestack to your project:

## iOS installation

<details>
  <summary>iOS details</summary>

### Set deployment target

react-native-spokestack makes use of relatively new APIs only available in iOS 13+. Make sure to set your deployment target to iOS 13.

First, open XCode and go to Project -> Info to set the iOS Deployment target to 13.0 or higher.

Also, set deployment to 13.0 under Target -> General -> Deployment Info.

### Remove invalid library search path

When Flipper was introduced to React Native, some library search paths were set for Swift. There has been a longstanding issue with the default search paths in React Native projects because a search path was added for swift 5.0 which prevented any other React Native libraries from using APIs only available in Swift 5.2 or later. Spokestack-iOS, a dependency of react-native-spokestack makes use of these APIs and XCode will fail to build.

Fortunately, the fix is fairly simple. Go to your target -> Build Settings and search for "Library Search Paths".

Remove `"\"$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)\""` from the list.

### Edit Podfile

Before running `pod install`, make sure to make the following edits.

```ruby
platform :ios, '13.0'
```

We also need to use `use_frameworks!` in our Podfile in order to support dependencies written in Swift.

```ruby
target 'SpokestackExample' do
  use_frameworks!
  #...
```

For the time being, `use_frameworks!` does not work with Flipper, so we also need to disable Flipper. Remove any Flipper-related lines in your Podfile. In React Native 0.63.2, they look like this:

```ruby
  # X Remove or comment out these lines X
  # use_flipper!
  # post_install do |installer|
  #   flipper_post_install(installer)
  # end
  # XX
```

#### react-native-permissions pods

We use [react-native-permissions](https://github.com/react-native-community/react-native-permissions) to check and request the Microphone permission (iOS and Android) and the Speech Recognition permission (iOS only). This library separates each permission into its own pod to avoid inflating your app with code you don't use. Add the following pods to your Podfile:

```ruby
target 'SpokestackTrayExample' do
  # ...
  permissions_path = '../node_modules/react-native-permissions/ios'
  pod 'Permission-Microphone', :path => "#{permissions_path}/Microphone.podspec"
  pod 'Permission-SpeechRecognition', :path => "#{permissions_path}/SpeechRecognition.podspec"
```

#### Bug in React Native 0.64.0 (should be fixed in 0.64.1)

React Native 0.64.0 broke any projects using `use_frameworks!` in their Podfiles.

For more info on this bug, see https://github.com/facebook/react-native/issues/31149.

To workaround this issue, add the following to your Podfile:

```ruby
# Moves 'Generate Specs' build_phase to be first for FBReactNativeSpec
post_install do |installer|
  installer.pods_project.targets.each do |target|
    if (target.name&.eql?('FBReactNativeSpec'))
      target.build_phases.each do |build_phase|
        if (build_phase.respond_to?(:name) && build_phase.name.eql?('[CP-User] Generate Specs'))
          target.build_phases.move(build_phase, 0)
        end
      end
    end
  end
end
```

#### pod install

Remove your existing Podfile.lock and Pods folder to ensure no conflicts, then install the pods:

```sh
$ npx pod-install
```

### Edit Info.plist

Add the following to your Info.plist to enable permissions. In XCode, also ensure your iOS deployment target is set to 13.0 or higher.

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app uses the microphone to hear voice commands</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>This app uses speech recognition to process voice commands</string>
```

#### Remove Flipper

While Flipper works on fixing their pod for `use_frameworks!`, we must disable Flipper. We already removed the Flipper dependencies from Pods above, but there remains some code in the AppDelegate.m that imports Flipper. There are two ways to fix this.

1. You can disable Flipper imports without removing any code from the AppDelegate. To do this, open your xcworkspace file in XCode. Go to your target, then Build Settings, search for "C Flags", remove `-DFB_SONARKIT_ENABLED=1` from flags.
1. Remove all Flipper-related code from your AppDelegate.m.

In our example app, we've done option 1 and left in the Flipper code in case they get it working in the future and we can add it back.

### Edit AppDelegate.m

#### Add AVFoundation to imports

```objc
#import <AVFoundation/AVFoundation.h>
```

#### AudioSession category

Set the AudioSession category. There are several configurations that work.

The following is a suggestion that should fit most use cases:

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

</details>

## Android installation

<details>
  <summary>Android details</summary>

### ASR Support

The example usage uses the system-provided ASRs (`AndroidSpeechRecognizer` and `AppleSpeechRecognizer`). However, `AndroidSpeechRecognizer` is not available on 100% of devices. If your app supports a device that doesn't have built-in speech recognition, use Spokestack ASR instead by setting the `profile` to a Spokestack profile using the `profile` prop.

See our [ASR documentation](https://www.spokestack.io/docs/concepts/asr) for more information.

### Edit root build.gradle (_not_ app/build.gradle)

```groovy
// ...
  ext {
    // Minimum SDK is 21
    minSdkVersion = 21
// ...
  dependencies {
    // Minimium gradle is 3.0.1+
    // The latest React Native already has this
    classpath("com.android.tools.build:gradle:3.5.3")
```

### Edit AndroidManifest.xml

Add the necessary permissions to your `AndroidManifest.xml`. The first permission is often there already. The second is needed for using the microphone.

```xml
    <!-- For TTS -->
    <uses-permission android:name="android.permission.INTERNET" />
    <!-- For wakeword and ASR -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <!-- For ensuring no downloads happen over cellular, unless forced -->
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

</details>

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
      // The NLU models are downloaded and then cached
      // when the app is first installed.
      // See https://spokestack.io/docs/concepts/nlu
      // for more info on NLU.
      nlu={{
        nlu: 'https://somecdn/nlu.tflite',
        vocab: 'https://somecdn/vocab.txt',
        metadata: 'https://somecdn/metadata.json'
      }}
    />
  )
}
```

## Including model files in your app bundle

To include model files locally in your app (rather than downloading them from a CDN), you also need to add the necessary extensions so
the files can be included by Babel. To do this, edit your [`metro.config.js`](https://facebook.github.io/metro/docs/configuration/).

```js
const defaults = require('metro-config/src/defaults/defaults')

module.exports = {
  resolver: {
    // json is already in the list
    assetExts: defaults.assetExts.concat(['tflite', 'txt', 'sjson'])
  }
}
```

Then include model files using source objects:

```js
<SpokestackTray
  clientId={process.env.SPOKESTACK_CLIENT_ID}
  clientSecret={process.env.SPOKESTACK_CLIENT_SECRET}
  handleIntent={handleIntent}
  wakeword={{
    filter: require('./filter.tflite'),
    detect: require('./detect.tflite'),
    encode: require('./encode.tflite')
  }}
  nlu={{
    model: require('./nlu.tflite'),
    vocab: require('./vocab.txt'),
    // Be sure not to use "json" here.
    // We use a different extension (.sjson) so that the file is not
    // immediately parsed as json and instead
    // passes a require source object to Spokestack.
    // The special extension is only necessary for local files.
    metadata: require('./metadata.sjson')
  }}
/>
```

This is not required. Pass remote URLs to the same config options and the files will be downloaded and cached when first calling `initialize`.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

---

# Documentation

## `<SpokestackTray />` Component Props

### buttonWidth

• `Optional` **buttonWidth**: _number_ (Default: **60**)

Width (and height) of the mic button

Defined in: [src/SpokestackTray.tsx:132](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L132)

### clientId

• **clientId**: _string_

Your Spokestack tokens generated in your Spokestack account
at https://spokestack.io/account.
Create an account for free then generate a token.
This is from the "ID" field.

Defined in: [src/SpokestackTray.tsx:74](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L74)

### clientSecret

• **clientSecret**: _string_

Your Spokestack tokens generated in your Spokestack account
at https://spokestack.io/account.
Create an account for free then generate a token.
This is from the "secret" field.

Defined in: [src/SpokestackTray.tsx:81](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L81)

### closeDelay

• `Optional` **closeDelay**: _number_ (Default: **0**)

How long to wait to close the tray after speaking (ms)

Defined in: [src/SpokestackTray.tsx:134](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L134)

### debug

• `Optional` **debug**: _boolean_

Show debug messages from react-native-spokestack

Defined in: [src/SpokestackTray.tsx:136](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L136)

### duration

• `Optional` **duration**: _number_ (Default: **500**)

Duration for the tray animation (ms)

Defined in: [src/SpokestackTray.tsx:138](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L138)

### easing

• `Optional` **easing**: EasingFunction (Default: **Easing.bezier(0.77, 0.41, 0.2, 0.84)**)

Easing function for the tray animation

Defined in: [src/SpokestackTray.tsx:140](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L140)

### editTranscript

• `Optional` **editTranscript**: (`transcript`: _string_) => _string_ (Default: **(transcript) => transcript**)

Edit the transcript before classification
and before the user response bubble is shown.

#### Type declaration

▸ (`transcript`: _string_): _string_

#### Parameters

| Name         | Type     |
| :----------- | :------- |
| `transcript` | _string_ |

**Returns:** _string_

Defined in: [src/SpokestackTray.tsx:145](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L145)

### exitNodes

• `Optional` **exitNodes**: _string_[]

All nodes in this array should end
the conversation and close the tray

Defined in: [src/SpokestackTray.tsx:150](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L150)

### fontFamily

• `Optional` **fontFamily**: _string_

Font to use for "LISTENING...", "LOADING...",
and chat bubble text.

Defined in: [src/SpokestackTray.tsx:155](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L155)

### gradientColors

• `Optional` **gradientColors**: _string_[] (Default: **["#61fae9", "#2F5BEA"]**)

Colors for the linear gradient shown when listening
Can be any number of colors (recommended: 2-3)

Defined in: [src/SpokestackTray.tsx:160](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L160)

### greet

• `Optional` **greet**: _boolean_ (Default: **false**)

Whether to greet the user with a welcome message
when the tray opens.
Note: `handleIntent` must respond to the "greet" intent.

Defined in: [src/SpokestackTray.tsx:166](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L166)

### handleIntent

• **handleIntent**: (`intent`: _string_, `slots?`: SpokestackNLUSlots, `utterance?`: _string_) => _[IntentResult](#IntentResult)_

This function takes an intent from the NLU
and returns an object with a unique conversation
node name (that you define) and a prompt
to be processed by TTS and spoken.

Note: the prompt is only shown in a chat bubble
if sound has been turned off.

#### Type declaration

▸ (`intent`: _string_, `slots?`: SpokestackNLUSlots, `utterance?`: _string_): _[IntentResult](#IntentResult)_

#### Parameters

| Name         | Type               |
| :----------- | :----------------- |
| `intent`     | _string_           |
| `slots?`     | SpokestackNLUSlots |
| `utterance?` | _string_           |

**Returns:** _[IntentResult](#IntentResult)_

Defined in: [src/SpokestackTray.tsx:91](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L91)

### haptic

• `Optional` **haptic**: _boolean_ (Default: **true**)

Set this to false to disable the haptic
that gets played whenever the tray starts listening.

Defined in: [src/SpokestackTray.tsx:171](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L171)

### keyword

• `Optional` **keyword**: KeywordConfig

Configuration for keyword recognition

The filter, detect, encode, and metadata fields accept 2 types of values.

1. A string representing a remote URL from which to download and cache the file (presumably from a CDN).
2. A source object retrieved by a `require` or `import` (e.g. `model: require('./nlu.tflite')`)

See https://www.spokestack.io/docs/concepts/keywords to learn more about keyword recognition.

**`example`**

```js
// ...
keyword={{
  detect: 'https://s.spokestack.io/u/UbMeX/detect.tflite',
  encode: 'https://s.spokestack.io/u/UbMeX/encode.tflite',
  filter: 'https://s.spokestack.io/u/UbMeX/filter.tflite',
  metadata: 'https://s.spokestack.io/u/UbMeX/metadata.json'
}}
```

You can also download models ahead of time and include them from local files.
Note: this requires a change to your metro.config.js. For more info, see
"Including model files in your app bundle" in the README.md.

```js
// ...
keyword={{
  detect: require('./detect.tflite'),
  encode: require('./encode.tflite'),
  filter: require('./filter.tflite'),
  // IMPORTANT: a special extension is used for local metadata JSON files (`.sjson`) when using `require` or `import`
  // so the file is not parsed when included but instead imported as a source object. This makes it so the
  // file is read and parsed by the underlying native libraries instead.
  metadata: require('./metadata.sjson')
}}
```

Keyword configuration also accepts a classes field for when metadata is not specified.

```js
// ...
keyword={{
  detect: require('./detect.tflite'),
  encode: require('./encode.tflite'),
  filter: require('./filter.tflite'),
  classes: ['one', 'two', 'three]
}}
```

Defined in: [src/SpokestackTray.tsx:221](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L221)

### minHeight

• `Optional` **minHeight**: _number_ (Default: **170**)

Minimum height for the tray

Defined in: [src/SpokestackTray.tsx:223](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L223)

### nlu

• **nlu**: NLUConfig

The NLU Tensorflow Lite model (.tflite), JSON metadata, and NLU vocabulary (.txt)

All 3 fields accept 2 types of values.

1. A string representing a remote URL from which to download and cache the file (presumably from a CDN).
2. A source object retrieved by a `require` or `import` (e.g. `model: require('./nlu.tflite')`)

See https://spokestack.io/docs/concepts/nlu to learn more about NLU.

```js
// ...
nlu={{
  model: 'https://somecdn.com/nlu.tflite',
  vocab: 'https://somecdn.com/vocab.txt',
  metadata: 'https://somecdn.com/metadata.json'
}}
```

You can also pass local files.
Note: this requires a change to your metro.config.js. For more info, see
"Including model files in your app bundle" in the README.md.

```js
// ...
nlu={{
  model: require('./nlu.tflite'),
  vocab: require('./vocab.txt'),
  // IMPORTANT: a special extension is used for local metadata JSON files (`.sjson`) when using `require` or `import`
  // so the file is not parsed when included but instead imported as a source object. This makes it so the
  // file is read and parsed by the underlying native libraries instead.
  metadata: require('./metadata.sjson')
}}
```

Defined in: [src/SpokestackTray.tsx:130](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L130)

### onClose

• `Optional` **onClose**: () => _void_

Called whenever the tray has closed

#### Type declaration

▸ (): _void_

**Returns:** _void_

Defined in: [src/SpokestackTray.tsx:227](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L227)

### onError

• `Optional` **onError**: (`e`: SpokestackErrorEvent) => _void_

Called whenever there's an error from Spokestack

#### Type declaration

▸ (`e`: SpokestackErrorEvent): _void_

#### Parameters

| Name | Type                 |
| :--- | :------------------- |
| `e`  | SpokestackErrorEvent |

**Returns:** _void_

Defined in: [src/SpokestackTray.tsx:229](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L229)

### onOpen

• `Optional` **onOpen**: () => _void_

Called whenever the tray has opened

#### Type declaration

▸ (): _void_

**Returns:** _void_

Defined in: [src/SpokestackTray.tsx:231](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L231)

### orientation

• `Optional` **orientation**: `"left"` \| `"right"` (Default: **"left"**)

The tray button can be oriented on either side of the screen

Defined in: [src/SpokestackTray.tsx:235](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L235)

### primaryColor

• `Optional` **primaryColor**: _string_ (Default: **"#2f5bea"**)

This color is used to theme the tray
and is used in the mic button and speech bubbles.

Defined in: [src/SpokestackTray.tsx:240](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L240)

### profile

• `Optional` **profile**: PipelineProfile

The Spokestack config profile to pass to
react-native-spokestack.
These are available from react-native-spokestack
starting in version 4.0.0.

If Wakeword config files are specified, the default will be
`TFLITE_WAKEWORD_NATIVE_ASR`.
Otherwise, the default is `PTT_NATIVE_ASR`.

```js
import SpokestackTray from 'react-native-spokestack-tray'
import { PipelineProfile } from 'react-native-spokestack'

// ...
<SpokestackTray
 profile={PipelineProfile.TFLITE_WAKEWORD_SPOKESTACK_ASR}
// ...
```

Defined in: [src/SpokestackTray.tsx:261](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L261)

### refreshModels

• `Optional` **refreshModels**: _boolean_

Use this sparingly to refresh the
wakeword, keyword, and NLU models on device
(force overwrite).
`<SpokestackTray refreshModels={process.env.NODE_ENV !== 'production'} ... />`

Defined in: [src/SpokestackTray.tsx:268](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L268)

### sayGreeting

• `Optional` **sayGreeting**: _boolean_ (Default: **true**)

Whether to speak the greeting or only display
a chat bubble with the greet message,
even if sound is on.

Defined in: [src/SpokestackTray.tsx:274](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L274)

### soundOffImage

• `Optional` **soundOffImage**: ReactNode (Default: **(
<Image source={soundOffImage} style={{ width: 30, height: 30 }} />
)**)

Replace the sound off image by passing a React Image component

Defined in: [src/SpokestackTray.tsx:278](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L278)

### soundOnImage

• `Optional` **soundOnImage**: ReactNode (Default: **(
<Image source={soundOnImage} style={{ width: 30, height: 30 }} />
)**)

Replace the sound on image by passing a React Image component

Defined in: [src/SpokestackTray.tsx:276](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L276)

### spokestackConfig

• `Optional` **spokestackConfig**: _Partial_<SpokestackConfig\>

Pass options directly to the Spokestack.initialize()
function from react-native-spokestack.
See https://github.com/spokestack/react-native-spokestack
for available options.

Defined in: [src/SpokestackTray.tsx:285](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L285)

### startHeight

• `Optional` **startHeight**: _number_ (Default: **220**)

Starting height for tray

Defined in: [src/SpokestackTray.tsx:287](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L287)

### style

• `Optional` **style**: `false` \| _RegisteredStyle_<ViewStyle\> \| _Value_ \| _AnimatedInterpolation_ \| _WithAnimatedObject_<ViewStyle\> \| _WithAnimatedArray_<`false` \| ViewStyle \| RegisteredStyle<ViewStyle\> \| RecursiveArray<`false` \| ViewStyle \| RegisteredStyle<ViewStyle\>\> \| readonly (`false` \| ViewStyle \| _RegisteredStyle_<ViewStyle\>)[]\>

This style prop is passed to the tray's container

Defined in: [src/SpokestackTray.tsx:289](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L289)

### ttsFormat

• `Optional` **ttsFormat**: TTSFormat (Default: **TTSFormat.TEXT**)

The format for the text passed to Spokestack.synthesize

Defined in: [src/SpokestackTray.tsx:291](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L291)

### voice

• `Optional` **voice**: _string_ (Default: **"demo-male"**)

A key for a voice in Spokestack TTS, passed to Spokestack.synthesize.
This may only be changed if you have created a custom voice using a
Spokestack Maker account. See https://spokestack.io/pricing#maker.
If not specified, Spokestack's Free "demo-male" voice is used.

Defined in: [src/SpokestackTray.tsx:293](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L293)

### wakeword

• `Optional` **wakeword**: WakewordConfig

The NLU Tensorflow Lite models (.tflite) for wakeword.

All 3 fields accept 2 types of values.

1. A string representing a remote URL from which to download and cache the file (presumably from a CDN).
2. A source object retrieved by a `require` or `import` (e.g. `model: require('./nlu.tflite')`)

See https://spokestack.io/docs/concepts/wakeword-models to learn more about Wakeword

Spokestack offers sample wakeword model files ("Spokestack"):

```js
// ...
wakeword={{
  detect: 'https://s.spokestack.io/u/hgmYb/detect.tflite',
  encode: 'https://s.spokestack.io/u/hgmYb/encode.tflite',
  filter: 'https://s.spokestack.io/u/hgmYb/filter.tflite'
}}
```

You can also download these models ahead of time and include them from local files.
Note: this requires a change to your metro.config.js. For more info, see
"Including model files in your app bundle" in the README.md.

```js
// ...
wakeword={{
  detect: require('./detect.tflite'),
  encode: require('./encode.tflite'),
  filter: require('./filter.tflite')
}}
```

Defined in: [src/SpokestackTray.tsx:327](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L327)

#### IntentResult

### data

• `Optional` **data**: _any_

Any other data you might want to add

Defined in: [src/SpokestackTray.tsx:64](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L64)

### noInterrupt

• `Optional` **noInterrupt**: _boolean_

Set to `true` to stop the wakeword recognizer
during playback of the prompt.

Defined in: [src/SpokestackTray.tsx:62](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L62)

### node

• **node**: _string_

A user-defined key to indicate where the user is in the conversation
Include this in the `exitNodes` prop if Spokestack should not listen
again after saying the prompt.

Defined in: [src/SpokestackTray.tsx:55](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L55)

### prompt

• **prompt**: _string_

Will be processed into Speech unless the tray is in silent mode

Defined in: [src/SpokestackTray.tsx:57](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L57)

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

### open

▸ **open**(): _void_

Open the tray, greet (if applicable), and listen

**Returns:** _void_

Defined in: [src/SpokestackTray.tsx:729](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L729)

### close

▸ **close**(): _void_

Close the tray, stop listening, and restart wakeword

**Returns:** _void_

Defined in: [src/SpokestackTray.tsx:740](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L740)

### say

▸ **say**(`input`: _string_): _Promise_<void\>

Passes the input to Spokestack.synthesize(),
plays the audio, and adds a speech bubble.

#### Parameters

| Name    | Type     |
| :------ | :------- |
| `input` | _string_ |

**Returns:** _Promise_<void\>

Defined in: [src/SpokestackTray.tsx:752](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L752)

### addBubble

▸ **addBubble**(`bubble`: _Bubble_): _void_

Add a bubble (system or user)
to the chat interface

#### Parameters

| Name     | Type     |
| :------- | :------- |
| `bubble` | _Bubble_ |

**Returns:** _void_

Defined in: [src/SpokestackTray.tsx:785](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L785)

#### Bubble

### isLeft

• **isLeft**: _boolean_

Defined in: [src/components/SpeechBubbles.tsx:9](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/components/SpeechBubbles.tsx#L9)

### text

• **text**: _string_

Defined in: [src/components/SpeechBubbles.tsx:8](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/components/SpeechBubbles.tsx#L8)

### toggleSilent

▸ **toggleSilent**(): _Promise_<boolean\>

Toggle silent mode

**Returns:** _Promise_<boolean\>

Defined in: [src/SpokestackTray.tsx:802](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L802)

### isSilent

▸ **isSilent**(): _boolean_

Returns whether the tray is in silent mode

**Returns:** _boolean_

Defined in: [src/SpokestackTray.tsx:814](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/SpokestackTray.tsx#L814)

---

## Spokestack Functions

These functions are available as exports from react-native-spokestack-tray

### listen

▸ **listen**(): _Promise_<void\>

Tells the Spokestack speech pipeline to start listening.
Also requests permission to listen if necessary.
It will attempt to start the pipeline before activating
if not already started.
This function will do nothing if the app is in the background.

```
import { listen } from 'react-native-spokestack-tray'
try {
  await listen()
} catch (error) {
  console.error(error)
}
```

**Returns:** _Promise_<void\>

Defined in: [src/Spokestack.ts:21](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/Spokestack.ts#L21)

### stopListening

▸ **stopListening**(): _Promise_<void\>

**Returns:** _Promise_<void\>

Defined in: [src/Spokestack.ts:30](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/Spokestack.ts#L30)

### isListening

▸ `Const` **isListening**(): _Promise_<boolean\>

Returns whether Spokestack is currently listening

```js
console.log(`isListening: ${await isListening()}`)
```

**Returns:** _Promise_<boolean\>

Defined in: [src/index.ts:19](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/index.ts#L19)

### isInitialized

▸ `Const` **isInitialized**(): _Promise_<boolean\>

Returns whether Spokestack has been initialized

```js
console.log(`isInitialized: ${await isInitialized()}`)
```

**Returns:** _Promise_<boolean\>

Defined in: [src/index.ts:27](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/index.ts#L27)

### isStarted

▸ `Const` **isStarted**(): _Promise_<boolean\>

Returns whether the speech pipeline has been started

```js
console.log(`isStarted: ${await isStarted()}`)
```

**Returns:** _Promise_<boolean\>

Defined in: [src/index.ts:35](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/index.ts#L35)

### addEventListener

▸ `Const` **addEventListener**(`eventType`: _string_, `listener`: (`event`: _any_) => _void_, `context?`: Object): EmitterSubscription

Bind to any event emitted by the native libraries
The events are: "recognize", "partial_recognize", "error", "activate", "deactivate", and "timeout".
See the bottom of the README.md for descriptions of the events.

```js
useEffect(() => {
  const listener = addEventListener('recognize', onRecognize)
  // Unsubscribe by calling remove when components are unmounted
  return () => {
    listener.remove()
  }
}, [])
```

#### Parameters

| Name        | Type                       |
| :---------- | :------------------------- |
| `eventType` | _string_                   |
| `listener`  | (`event`: _any_) => _void_ |
| `context?`  | Object                     |

**Returns:** EmitterSubscription

Defined in: [src/index.ts:51](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/index.ts#L51)

### removeEventListener

▸ `Const` **removeEventListener**(`eventType`: _string_, `listener`: (...`args`: _any_[]) => _any_): _void_

Remove an event listener

```js
removeEventListener('recognize', onRecognize)
```

#### Parameters

| Name        | Type                          |
| :---------- | :---------------------------- |
| `eventType` | _string_                      |
| `listener`  | (...`args`: _any_[]) => _any_ |

**Returns:** _void_

Defined in: [src/index.ts:59](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/index.ts#L59)

### removeAllListeners

▸ `Const` **removeAllListeners**(): _void_

Remove any existing listeners

```js
componentWillUnmount() {
  removeAllListeners()
}
```

**Returns:** _void_

Defined in: [src/index.ts:69](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/index.ts#L69)

---

# Events

Use `addEventListener()`, `removeEventListener()`, and `removeAllListeners()` to add and remove events handlers. All events are available in both iOS and Android.

| Name              |           Data           |                                                                                                Description |
| :---------------- | :----------------------: | ---------------------------------------------------------------------------------------------------------: |
| recognize         | `{ transcript: string }` |                                                  Fired whenever speech recognition completes successfully. |
| partial_recognize | `{ transcript: string }` |                                           Fired whenever the transcript changes during speech recognition. |
| start             |          `null`          |                 Fired when the speech pipeline starts (which begins listening for wakeword or starts VAD). |
| stop              |          `null`          |                                                                      Fired when the speech pipeline stops. |
| activate          |          `null`          | Fired when the speech pipeline activates, either through the VAD, wakeword, or when calling `.activate()`. |
| deactivate        |          `null`          |                                                                Fired when the speech pipeline deactivates. |
| play              |  `{ playing: boolean }`  |                                      Fired when TTS playback starts and stops. See the `speak()` function. |
| timeout           |          `null`          |                                        Fired when an active pipeline times out due to lack of recognition. |
| trace             |  `{ message: string }`   |         Fired for trace messages. Verbosity is determined by the [`traceLevel`](#SpokestackConfig) option. |
| error             |   `{ error: string }`    |                                                                 Fired when there's an error in Spokestack. |

_When an error event is triggered, any existing promises are rejected._

---

## Checking speech permissions

These utility functions are used by Spokestack to check microphone permission on iOS and Android and speech recognition permission on iOS.

### checkSpeech

▸ **checkSpeech**(): _Promise_<boolean\>

This function can be used to check whether the user has given
the necessary permission for speech.
On iOS, this includes both microphone and speech recnogition.
On Android, only the microphone is needed.

```js
import { checkSpeech } from 'react-native-spokestack-tray'

// ...

const hasPermission = await checkSpeech()
```

**Returns:** _Promise_<boolean\>

Defined in: [src/utils/permissions.ts:78](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/utils/permissions.ts#L78)

### requestSpeech

▸ **requestSpeech**(): _Promise_<boolean\>

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

**Returns:** _Promise_<boolean\>

Defined in: [src/utils/permissions.ts:106](https://github.com/spokestack/react-native-spokestack-tray/blob/112b529/src/utils/permissions.ts#L106)

---

## License

MIT
