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

# A one-liner to install all dependencies
$ npm install react-native-spokestack-tray react-native-spokestack @react-native-community/async-storage @react-native-community/netinfo react-native-video rn-fetch-blob react-native-haptic-feedback react-native-linear-gradient react-native-permissions
```

### Installing pods

We use [react-native-permissions](https://github.com/react-native-community/react-native-permissions) to check and request the Microphone permission (iOS and Android) and the Speech Recognition permission (iOS only). This library separates each permission into their own pod to avoid inflating your app with code you don't use. Add the following pods to your Podfile...

```ruby
target 'SpokestackTrayExample' do
  # ...
  permissions_path = '../node_modules/react-native-permissions/ios'
  pod 'Permission-Microphone', :path => "#{permissions_path}/Microphone.podspec"
  pod 'Permission-SpeechRecognition', :path => "#{permissions_path}/SpeechRecognition.podspec"
```

Because a couple of our dependencies are written using Swift, we need to use
`use_frameworks!` in our Podfile.

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

Remove your existing Podfile.lock and Pods folder to ensure no conflicts, then run pod install...

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

### Edit your AppDelegate.m

While Flipper works on fixing their pod for `use_frameworks!`, we must disable Flipper in the meantime. We already removed the Flipper dependencies from Pods above, but there remains some code in the AppDelegate.m that imports Flipper. There are two ways to fix this.

1. Open your xcworkspace file in XCode. Go to your target, then Build Settings, search for "C Flags", remove `-DFB_SONARKIT_ENABLED=1` from flags.
1. Remove all Flipper-related code from your AppDelegate.m.

In our example app, we've done option 1 and left in the Flipper code in case they get it working in the future and we can add it back.

## Usage

```js
import SpokestackTray from 'react-native-spokestack-tray'

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

## License

MIT
