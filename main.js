const VM = require('./VM')
const Robot = require('./Robot')
const CursorReal = require('./CursorReal')

(async () => {

  let robot = new Robot(serial...)
  let cursor = new CursorReal(serial...)
  
  let vm = new VM(cursor, robot)

})()