/**
 * This file is an example of how you might respond to the NLU.
 * See minecraft_metadata.json for a copy of the NLU metadata
 * downloaded to the app. This has a list of all possible intents
 * to which the app should respond.
 */
import type { IntentResult } from 'react-native-spokestack-tray'

const greeting = {
  node: 'greeting',
  prompt:
    'Welcome! This example uses Minecraft sample models. Try saying, "How do I make a castle?"',
  noInterrupt: true
}

let lastNode: IntentResult = greeting

export default function handleIntent(
  intent: string,
  slots?: any,
  utterance?: string
) {
  console.log(`Intent from NLU is ${intent} with slots`, slots)
  console.log(`User said: ${utterance}`)
  switch (intent) {
    case 'AMAZON.RepeatIntent':
      return lastNode
    case 'AMAZON.YesIntent':
      lastNode = {
        node: 'search',
        prompt: 'I heard you say yes! What would you like to make?'
      }
      return lastNode
    case 'AMAZON.NoIntent':
      lastNode = {
        node: 'exit',
        prompt: 'I heard you say no. Goodbye.'
      }
      return lastNode
    case 'AMAZON.StopIntent':
    case 'AMAZON.CancelIntent':
    case 'AMAZON.FallbackIntent':
      lastNode = {
        node: 'exit',
        prompt: 'Goodbye!'
      }
      return lastNode
    case 'RecipeIntent':
      lastNode = {
        node: 'recipe',
        prompt: `If I were a real app, I would show a screen now on how to make ${
          slots.length ? `a ${slots[0].value}` : 'something'
        }. Want to continue?`
      }
      return lastNode
    case 'AMAZON.HelpIntent':
      lastNode = {
        node: 'help',
        prompt: 'Try saying, "How do I make a castle?". To exit, say "exit".'
      }
      return lastNode
    default:
      lastNode = greeting
      return lastNode
  }
}
