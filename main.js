const VM = require('./VM');
const Robot = require('./RobotVirtual');
// const CursorReal = require('./CursorReal')

const CursorFile = require('./CursorFile');

(async () => {

  try {
    let cursor = new CursorFile('examples/collision.turin')
    let robot = new Robot('/dev/tty.JOAO_S2_IVAN-DevB')

    await robot.ready()
    
    let vm = new VM(cursor, robot)
    await vm.run()
  } catch (e) {
    // some error occured, check the logs
    console.log(e)
    process.exit(1)
  }
})()
