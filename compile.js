const fs = require('fs')
const chalk = require('chalk')
const Compiler = require('./compilers/CompilerAssembly')
const CursorFile = require('./CursorFile')
const CursorReal = require('./CursorReal')


async function main() {
  console.log('--- compiling ---')

  // let cursor = new CursorFile('examples/collision.turin', 10)
  let cursor = new CursorReal(await CursorReal.getPort('/dev/tty.wchusbserial1410'))
  let compiler = new Compiler(cursor)

  await cursor.ready()

  let code = await compiler.compile()

  console.log()
  console.log()
  console.log('---------------------')
  console.log(code)
  console.log('---------------------')
  console.log()
  console.log()

  await compiler.resetHead()

  fs.writeFileSync('turin.asm', code)
  console.log(chalk.green('Compiled to'), chalk.green.bold('turin.asm'))
  process.exit(0)
}


process.on('unhandledRejection', (e) => {
  let stack = e.stack
  
  if (e.stack)
    stack = e.stack.replace(new RegExp(__dirname, 'g'), '.')

  console.log(stack)
  process.exit(1)
})

process.on('exit', ()=>{
  console.log()
  console.log('Bye! :)')
  console.log()
})

main()