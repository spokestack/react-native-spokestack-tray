const fs = require('fs')
const prettier = require('prettier')
const pkg = require('../package.json')
function read(filename) {
  return fs.readFileSync(`${__dirname}/${filename}`, { encoding: 'utf8' })
}
function write(filename, data) {
  return fs.writeFileSync(`${__dirname}/${filename}`, data)
}

// Remove links that aren't links to source
function removeLinks(data) {
  return data.replace(/\[([^:]+)\]\(.*?\)/g, '$1')
}
/**
 * @param {Array<string>} functions List of functions to extract from docs
 */
function getModuleFunctions(functions) {
  const available = removeLinks(read('../docs/README.md'))
    // Remove everything up to functions
    .replace(/[^]+#{2}\s*Functions/, '')
    .split(/___/)
  return functions
    .map((fn) => {
      const rfn = new RegExp(`###\\s*${fn}[^#]+?`)
      const doc = available.find((existing) => rfn.test(existing))
      return doc || ''
    })
    .join('\n\n')
}

function getInterfaceContent(filename, hideHeader) {
  return removeLinks(
    read(`../docs/interfaces/${filename}`)
      .replace(
        /# Interface:\s*(.+)[^]+##\s*Properties/,
        hideHeader ? '' : '#### $1'
      )
      .replace(/___/g, '')
      // Remove superfluous type declarations
      .replace(/#### Type declaration:[^]+?▸ .+/g, '')
      // Remove double "Defined in"
      .replace(/(Defined in: .+)\n\nDefined in: .+/g, '$1')
  )
}

function getClassMethods(filename, methods) {
  const available = removeLinks(read(`../docs/classes/${filename}`))
    // Remove everything up to functions
    .replace(/[^]+#{2}\s*Functions/, '')
    .split(/___/)
  return methods
    .map((fn) => {
      const rfn = new RegExp(`###\\s*${fn}[^#]+?`)
      const doc = available.find((existing) => rfn.test(existing))
      return doc || ''
    })
    .join('\n\n')
}

// function getEnumContent(filename) {
//   return removeLinks(
//     read(`../docs/enums/${filename}`)
//       .replace(/# Enumeration:\s*(.+)/, '#### $1')
//       .replace(/\[.+\]\([./a-z]+\)\..+/, '')
//       .replace(/\n### .+/g, '')
//       .replace(/## Table of contents[^]+## Enumeration members/, '')
//       .replace(/___/g, '')
//   )
// }

const rprops = /(?:`Optional` )?\*\*(\w+)\*\*\s*: [^\n]+/g

// Start with the README
const header = '\n---\n\n# Documentation'
let data =
  read('../README.md').replace(new RegExp(header + '[\\w\\W]+'), '') + header

// Add Spokestack tray props
const source = read('../src/SpokestackTray.tsx')
const defaultProps = /static defaultProps: Partial<SpokestackTrayProps> = ({[^]+?\n {2}})/.exec(
  source
)[1]
const parsedDefaults = {}
defaultProps.replace(/(\w+): ([^]+?)(?:,\n|\n {2}})/g, (all, key, value) => {
  parsedDefaults[key] = value.replace(/'/g, '"')
})
const trayProps = getInterfaceContent('spokestacktrayprops.md', true)
data += '\n\n## `<SpokestackTray />` Component Props'
data += trayProps
  // Add in default values to option descriptions
  .replace(rprops, function (all, key) {
    return parsedDefaults[key]
      ? `${all} (Default: **${parsedDefaults[key]}**)`
      : all
  })
  .replace(/IntentResult/g, '[IntentResult](#IntentResult)')

data += getInterfaceContent('intentresult.md')

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

data += getClassMethods('default.md', ['open', 'close', 'say', 'addBubble'])
data += getInterfaceContent('bubble.md')
data += getClassMethods('default.md', ['toggleSilent', 'isSilent'])

// Add default exported functions
data += '\n---\n\n## Spokestack Functions\n'
data +=
  '\nThese functions are available as exports from react-native-spokestack-tray\n\n'
data += getModuleFunctions([
  'listen',
  'stopListening',
  'isListening',
  'isInitialized',
  'isStarted',
  'addEventListener',
  'removeEventListener',
  'removeAllListeners'
])

data += '\n\n---\n\n'
data += read('../node_modules/react-native-spokestack/EVENTS.md')
data += '\n\n---\n\n'

// Add permissions functions

data += '\n\n## Checking speech permissions\n'
data +=
  '\nThese utility functions are used by Spokestack to check microphone permission on iOS and Android and speech recognition permission on iOS.\n'

data += getModuleFunctions(['checkSpeech', 'requestSpeech'])

// Add license info
data += '\n---\n\n ## License\n\nMIT\n'

// Write a pretty version
write(
  '../README.md',
  prettier.format(data, { ...pkg.prettier, parser: 'markdown' })
)
