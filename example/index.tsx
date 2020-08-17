import App from './src/App'
import { AppRegistry } from 'react-native'
import { name as appName } from './app.json'

console.disableYellowBox = true

AppRegistry.registerComponent(appName, () => App)
