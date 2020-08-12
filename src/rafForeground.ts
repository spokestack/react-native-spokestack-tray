import { AppState } from 'react-native'
export default function rafForeground(fn: () => void) {
  if (AppState.currentState === 'active') {
    requestAnimationFrame(fn)
  } else {
    fn.call(null)
  }
}
