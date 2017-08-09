const _ = require('lodash');
const chalk = require('chalk');
const SerialPort = require('serialport')
// const CursorReal = require('./CursorReal')

const VM = require('./VM');
const RobotReal = require('./RobotReal');
const RobotVirtual = require('./RobotVirtual');
const CursorFile = require('./CursorFile');
const CursorReal = require('./CursorReal');

let vm
async function main() {
  try {
    // let cursor = new CursorFile('examples/collision.turin')
    let cursor = new CursorReal(await CursorReal.getPort('/dev/tty.wchusbserial1410'))
    let robot = new RobotVirtual()
    // let robot = new RobotReal('/dev/tty.JOAO_S2_IVAN-DevB')

    console.log('Waiting for Cursor...')
    await cursor.ready()
    console.log('Waiting for Robot...')
    await robot.ready()
    console.log('All ok! Starting VM...')
    
    vm = new VM(cursor, robot)
    await vm.run()

    console.log('Finished VM Execution, exiting')
    process.exit(0)
  } catch (e) {
    // some error occured, check the logs
    console.log(e.stack)

    // await vm.resetHead()

    process.exit(1)
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
  console.log('Thank you, bye! :)')
  console.log()
})

process.on('SIGINT', async () => {
  await vm.resetHead()
  process.exit(0)
})

main()