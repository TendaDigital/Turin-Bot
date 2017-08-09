const chalk = require('chalk')
const readline = require('readline')

require('draftlog').into(console)

const sleep = require('./sleep')
const CursorReal = require('./CursorReal')

// Inject DraftLog
require('draftlog').into(console)


const CURSOR_PORT = '/dev/tty.wchusbserial1450'

async function main(){
  let cursor = new CursorReal(await CursorReal.getPort(CURSOR_PORT))
  
  console.log('Awaiting cursor to be OK...')
  await cursor.ready()
  console.log('Cursor OK. Ready!')

  console.log()
  console.log()
  let lines = [
    console.draft('...'),
    // console.draft('...'),
    // console.draft('...'),
  ]
  // console.log()
  // console.log()

  readline.emitKeypressEvents(process.stdin)
  if (process.stdin.isTTY)
    process.stdin.setRawMode(true)

  process.stdin.on('keypress', function (chunk, key) {
    if (key && key.name == 'space') {
      lines = [
        console.draft('...'),
        // console.draft('...'),
        // console.draft('...'),
      ]
    }

    if (key && key.ctrl && key.name == 'c') {
      process.exit();
    }
  });


  while (1) {
    await sleep(50)
    let value = await cursor.read()

    let c1 = chalk.bgHex('#'+value[0])('       ')
    let c2 = chalk.bgHex('#'+value[1])('       ')
    for (let draft of lines) {
      draft(c1 + c2 + '  ' + value)
    }
  }
}

process.on('unhandledRejection', (e) => {
  let stack = e.stack
  
  if (e.stack)
    stack = e.stack.replace(new RegExp(__dirname, 'g'), '.')

  console.log(chalk.red(stack))
  process.exit(1)
})

process.on('exit', ()=>{
  console.log()
  console.log('Bye! :)')
  console.log()
})

main()
