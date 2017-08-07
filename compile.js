const fs = require('fs')
const chalk = require('chalk')
const Cursor = require('./CursorFile')
const Compiler = require('./compilers/CompilerAssembly')


async function main() {
  console.log('--- compiling ---')

  let cursor = new Cursor('examples/collision.turin', 10)
  let compiler = new Compiler(cursor)

  let code = await compiler.compile()

  console.log()
  console.log()
  console.log('---------------------')
  console.log(code)
  console.log('---------------------')
  console.log()
  console.log()

  fs.writeFileSync('turin.asm', code)
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