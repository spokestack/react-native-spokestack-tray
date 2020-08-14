const fs = require('fs')
const prettier = require('prettier')
const pkg = require('../package.json')
function read(filename) {
  return fs.readFileSync(`${__dirname}/${filename}`, { encoding: 'utf8' })
}
function write(filename, data) {
  return fs.writeFileSync(`${__dirname}/${filename}`, data)
}

function redoLinks(data) {
  return (
    data
      // Remove links that aren't links to source
      .replace(/\[([^:]+)\]\(.*?\)/g, '$1')
  )
}

/**
 * @param {string} filename
 * @param {Array<string>} methods List of methods to extract from docs
 */
function getClassMethods(filename, methods) {
  const fileData = redoLinks(read(`../docs/classes/${filename}`))
    // Remove everything up to methods
    .replace(/[\w\W]+#{2}\s*Methods/, '')
    .replace(/___/g, '')
  return methods
    .map((method) => {
      const rmethod = new RegExp(`#\\s*(${method}[\\w\\W]+?)##`)
      const match = rmethod.exec(fileData)
      return match ? `\n---\n### ${match[1]}` : ''
    })
    .join('\n\n')
}

function getInterfaceContent(filename) {
  return redoLinks(read(`../docs/interfaces/${filename}`))
    .replace(/[\w\W]+##\s*Properties/, '')
    .replace(/___/g, '')
    .replace(/\n### /g, '\n### ')
}

function getEnumContent(filename) {
  return redoLinks(read(`../docs/enums/${filename}`))
    .replace(/[\w\W]+##\s*Enumeration members/, '')
    .replace(/___/g, '')
    .replace(/\n### /g, '\n### ')
}

/**
 * @param {string} filename
 * @param {Array<string>} functions List of functions to extract from docs
 */
function getModuleFunctions(filename, functions) {
  const fileData = redoLinks(read(`../docs/modules/${filename}`))
    // Remove everything up to functions
    .replace(/[\w\W]+#{2}\s*Functions/, '')
    .replace(/___/g, '')
  return functions
    .map((fn) => {
      const rfn = new RegExp(`#\\s*(${fn}[\\w\\W]+?)##`)
      const match = rfn.exec(fileData)
      return match ? `\n---\n### ${match[1]}` : ''
    })
    .join('\n\n')
}

const rprops = /\*\*(\w+)\*\*\??\s*: \*\w+\*/g
const rdefaultProps = /\*\*(\w+)\*\*: (?:\*\w+?\* )?= (["\w-.]+)/g

// Start with the README
const header = '\n---\n\n# Documentation'
let data =
  read('../README.md').replace(new RegExp(header + '[\\w\\W]+'), '') + header

// Add default exported functions
data += '\n\n## Spokestack Functions'
data +=
  '\n\nThese functions are available as exports from react-native-spokestack-tray\n\n'
data += getModuleFunctions('_src_spokestack_.md', [
  'listen',
  'stopListening',
  'isListening'
])

// Add Spokestack tray props
const defaultOptions = redoLinks(
  read('../docs/classes/_src_spokestacktray_.spokestacktray.md')
)
  // Remove unwanted text
  .replace(/[\w\W]+\*\*defaultProps\*\*: \*object\*/, '')

const parsedDefaults = {}
defaultOptions.replace(rdefaultProps, function (all, key, value) {
  parsedDefaults[key] = value
  return all
})
const trayProps = getInterfaceContent('_src_spokestacktray_.props.md')
data += '\n---\n\n## `<SpokestackTray />` Component Props'
data += trayProps
  // Add in default values to option descriptions
  .replace(rprops, function (all, key) {
    return parsedDefaults[key]
      ? `${all} (Default: **${parsedDefaults[key]}**)`
      : all
  })
  .replace(/IntentResult/g, '[IntentResult](#IntentResult)')
  .replace(/ListenerEvent/g, '[ListenerEvent](#ListenerEvent)')

// Add IntentResult definition
data += '\n---\n\n#### `IntentResult`\n'
data += 'IntentResult is the expected return type of `handleIntent`.\n'
getInterfaceContent('_src_spokestacktray_.intentresult.md').replace(
  rprops,
  function (all) {
    data += `\n${all}\n`
  }
)

// Add ListenerEvent definition
data += '\n---\n\n#### `ListenerEvent`\n'
data += 'ListenerEvent is passed to some callbacks. '
data +=
  'Usually, only `type` and one other property is defined, depending on the context.\n\n'
getInterfaceContent('_src_spokestack_.listenerevent.md').replace(
  rprops,
  function (all) {
    data += `\n${all}\n`
  }
)

// Add ListenerType enum
data += '\n---\n\n#### `ListenerType` enum\n'
data += '`ListenerType` is used in `ListenerEvent`\n'
getEnumContent('_src_spokestack_.listenertype.md').replace(
  rdefaultProps,
  function (all) {
    data += `\n${all}\n`
  }
)

// Add SpokestackTray methods
data += '\n---\n\n## `<SpokestackTray />` Component Methods\n'
data +=
  '\nThese methods are available from the SpokestackTray component. Use a React ref to access these methods.'
data += `
\n\n
\`\`\`js
const spokestackTray = useRef(null)

  // ...
  <SpokestackTray ref={spokestackTray}

// ...
spokestackTray.current.say('Here is something for Spokestack to say')
\`\`\`
\n
**Note**: In most cases, you should call \`listen\` instead of \`open\`.
\n\n
`
data += getClassMethods('_src_spokestacktray_.spokestacktray.md', [
  'open',
  'close',
  'say',
  'addBubble'
])

// Add Bubble definition
data += '\n#### `Bubble`\n'
getInterfaceContent('_src_speechbubbles_.bubble.md').replace(rprops, function (
  all
) {
  data += `\n${all}\n`
})

data += getClassMethods('_src_spokestacktray_.spokestacktray.md', [
  'toggleSilent',
  'isSilent'
])

// Add license info
data += '\n---\n\n ## License\n\nMIT\n'

// Write a pretty version
write(
  '../README.md',
  prettier.format(data, { ...pkg.prettier, parser: 'markdown' })
)
