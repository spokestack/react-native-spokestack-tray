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
  return methods
    .map((method) => {
      const rmethod = new RegExp(`#\\s*(${method}[\\w\\W]+?)##`)
      const match = rmethod.exec(fileData)
      return match ? `##### ${match[1]}` : ''
    })
    .join('\n\n')
}

function getInterfaceContent(filename) {
  return redoLinks(read(`../docs/interfaces/${filename}`))
    .replace(/[\w\W]+##\s*Properties/, '')
    .replace(/___/g, '')
    .replace(/\n### /g, '\n##### ')
}

/**
 * @param {string} filename
 * @param {Array<string>} functions List of functions to extract from docs
 */
function getModuleFunctions(filename, functions) {
  const fileData = redoLinks(read(`../docs/modules/${filename}`))
    // Remove everything up to functions
    .replace(/[\w\W]+#{2}\s*Functions/, '')
  return functions
    .map((fn) => {
      const rfn = new RegExp(`#\\s*(${fn}[\\w\\W]+?)##`)
      const match = rfn.exec(fileData)
      return match ? `##### ${match[1]}` : ''
    })
    .join('\n\n')
}

// Start with the README
const header = '\n---\n\n# Documentation'
let data =
  read('../README.md').replace(new RegExp(header + '[\\w\\W]+'), '') + header

// Add default exported functions
data += '\n\n## Spokestack Functions'
data +=
  '\n\nThese functions are available as exports from react-native-spokestack-tray\n\n'
data += getModuleFunctions('_src_spokestack_.md', ['listen', 'isListening'])

// Add Spokestack tray props
const defaultOptions = redoLinks(
  read('../docs/classes/_src_spokestacktray_.spokestacktray.md')
)
  // Remove unwanted text
  .replace(/[\w\W]+\*\*defaultProps\*\*: \*object\*/, '')

const parsedDefaults = {}
defaultOptions.replace(/\*\*(\w+)\*\*: \*\w+\* = (["\w-.]+)/g, function (
  all,
  key,
  value
) {
  parsedDefaults[key] = value
  return all
})
const trayProps = getInterfaceContent('_src_spokestacktray_.props.md')
data += '\n\n## SpokestackTray Component Props'
data += trayProps
  // Add in default values to option descriptions
  .replace(/\*\*(\w+)\*\*\??\s*: \*\w+\*/g, function (all, key) {
    return parsedDefaults[key]
      ? `${all} (Default: **${parsedDefaults[key]}**)`
      : all
  })

// Add SpokestackTray methods
data += '\n\n## SpokestackTray Component Methods\n'
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
  'addBubble',
  'toggleSilent',
  'isSilent'
])

// Add license info
data += '\n\n ## License\n\nMIT\n'

// Write a pretty version
write(
  '../README.md',
  prettier.format(data, { ...pkg.prettier, parser: 'markdown' })
)
