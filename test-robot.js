const chalk = require('chalk')
const Robot = require('./RobotReal')
const readline = require('readline')


// Inject DraftLog
require('draftlog').into(console)

async function main(){
  let robot = new Robot('/dev/tty.JOAO_S2_IVAN-DevB')
  
  console.log('Awaiting robot to be OK...')
  await robot.ready()
  console.log('Robot OK. Ready!')

  // console.log()
  // let draft = console.draft('Reading...')
  // console.log()

  // const rl = readline.createInterface(process.stdin, process.stdout)
  readline.emitKeypressEvents(process.stdin)
  if (process.stdin.isTTY)
    process.stdin.setRawMode(true)

  process.stdin.on('keypress', function (chunk, key) {

    // console.log('Get Chunk: ' + chunk, key);

    if (key && key.name == 'up')
      robot.front()
    if (key && key.name == 'left')
      robot.left()
    if (key && key.name == 'right')
      robot.right()
    if (key && key.name == 'down')
      robot.stop()
    if (key && key.name == 'space')
      robot.beep()

    if (key && key.ctrl && key.name == 'c') {
      process.exit();
    }
  });

  // while(1) {


  //   // await robot.front();
  //   // await robot.right();
  //   // await robot.left();
  //   // await robot.beep();
  //   // let dist = await robot.read();
  //   // let dist = await robot.read()
  //   // let line = chalk.yellow('Reading: ')
  //   // if (dist < 50) {
  //   //   line += chalk.bgGreen(' ').repeat(dist)
  //   //   line += chalk.bgGreenBright(' ').repeat(50 - dist)
  //   // } else {
  //   //   line += chalk.bgRedBright(' ').repeat(50)
  //   // }

  //   // line += ' ' + dist + 'cm'
  //   // draft(line)
  // }
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
