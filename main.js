const VM = require('./VM');
const Robot = require('./Robot');
// const CursorReal = require('./CursorReal')

const CursorFile = require('./CursorFile');

(async () => {

  try {
    //let robot = new Robot(serial...)
    //let cursor = new CursorReal(serial...)
    let cursor = new CursorFile('examples/collision.turin')
    
    //let vm = new VM(cursor, robot)
    let vm = new VM(cursor)
    await vm.run()
  } catch (e) {
    // some error occured, check the logs
    console.log(e)
    process.exit(1)
  }
})()
