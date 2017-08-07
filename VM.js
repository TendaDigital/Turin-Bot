const _ = require('lodash')
const chalk = require('chalk')
const Lexer = require('./Lexer')

require('draftlog').into(console)

module.exports = class VM {
  constructor(cursorDelegate, robotDelegate) {
    this.cursor = cursorDelegate
    this.robot = robotDelegate

    // Debug mode
    this.debug = true

    // last command
    this.lastCommand = 0

    // keep position of saved bookmark
    this.bookmarks = {}

    // initialize all registers with 0
    this.registers = {
      'PURPLE' : 0,
      'BEIGE'  : 0,
      'DGREEN' : 0,
      'LGREEN' : 0,
      'ORANGE' : 0,
      'BLUE'   : 0,
      'RED'    : 0,
    }

    // defined a starting register
    this.currentRegister = 'PURPLE'
    this.currentCommand = null

    // readed lines
    this.commands = []
    this.lines = []

    // Rendering flags
    this.blockFrom = null
    this.blockTo = null
    // Render Register bar
    this.renderRegisterBar()
  }

  async run () {
    // find the beginning of the program
    this.cursor.goToStart()

    try {
      // while program not finished
      // while( !(await this.cursor.finished()) ) {
      do {
        // Clear jump being rendered
        this.renderJump()

        // read the command
        let command = this.currentCommand = await this.read()

        // check if commands is valid
        if (!Lexer.validate(command)) throw new Error("Invalid command!")

        //draw command
        await this.draw(true)

        // execute command
        await this.executeCommand(command)

        
      } while (await this.next())
    } catch (e) {
      console.log(e)
      this.cursor.halt()
    }

    console.log('Reseting head...')
    await this.resetHead()
    console.log('Finished Execution.')
    this.currentCommand = 'finished'
    this.draw(false)
  }

  async resetHead(){
    this.currentCommand = 'resetHead'
    this.renderJump(this.lastCommand, 0)
    while(this.lastCommand > 0)
      await this.previous()
    this.renderJump()
  }

  async executeCommand(command) {
    let { fn, args } = Lexer.findOperation(command)
    await this[fn](args) 
  }

  async saveBookmark(bookmark) {
    // console.log('Saving bookmark:' + bookmark)
    this.bookmarks[bookmark] = this.lastCommand;
  } 

  async goToBookmark(bookmark) {
    // console.log('Going to bookmark: ' + bookmark)
    this.renderJump(this.lastCommand, this.bookmarks[bookmark])
    while(this.lastCommand > this.bookmarks[bookmark]) {
      await this.previous()
      await this.read()
    }
  } 

  selectRegister(register) {
    this.currentRegister = register
  }

  async readFromSensor() {
    this.registers[this.currentRegister] = await this.robot.read()
  }

  incrementRegister() {
    this.registers[this.currentRegister]++
  }

  decrementRegister() {
    this.registers[this.currentRegister]--
  }

  async jumpFalse() {
    if(this.registers[this.currentRegister] == 0) {
      this.renderJump(this.lastCommand, this.lastCommand + 2)
      await this.next()
      await this.read()
    }
  }

  async jumpTrue() {
    if(this.registers[this.currentRegister] != 0) {
      this.renderJump(this.lastCommand, this.lastCommand + 2)
      await this.next()
      await this.read()
    }
  }

  /*
   * Cursor
   */
  async previous() {
    await this.cursor.previous()
    this.lastCommand--;
    this.draw()
  }

  async next() {
    let ret = await this.cursor.next()
    if (ret) {
      this.lastCommand++;
    }
    this.draw()
    return ret
  }

  async read() {
    let command = await this.cursor.read()

    this.commands[this.lastCommand] = command

    return command
  }

  /*
   * Robot
   */
  async front() {
    await this.robot.front()
  }

  async right() {
    await this.robot.right()
  }

  async left() {
    await this.robot.left()
  }

  async beep() {
    await this.robot.beep()
  }

  begin () {

  }

  // draw current execution in the terminal
  draw(executing) {
    // Fill up lines
    while (this.lines.length < this.commands.length) {
      this.lines.push(console.draft('...'))
    }

    // Render Register bar
    this.renderRegisterBar()

    // Render commands
    for (let index in this.lines) {
      let draft = this.lines[index]
      let command = this.commands[index]
      // Line Number
      let line = index + ': '
      line = chalk.dim(' '.repeat(4 - line.length) + line)

      // Arrow
      let arrow = '  '
      let block = this.renderBlockCommand(command)
      let jump = this.renderBlockJump(index)
      let explain = Lexer.name(command)

      if (index == this.lastCommand) {
        arrow = this.renderArrowState(executing)
        explain = chalk.white(explain)
      } else {
        explain = chalk.dim(explain)
      }

      draft(line + arrow + block + jump + explain)
    }
  }

  renderBlockJump (index) {
    let {blockFrom, blockTo} = this

    if (blockFrom == null && blockTo == null) 
      return '   '

    if (blockFrom == index) {
      return blockFrom < blockTo ? ' ╮ ' : ' ╯ '
    }

    if (blockTo == index) {
      return blockFrom < blockTo ? '◂╯ ' : '◂╮ '
    }

    let min = Math.min(blockFrom, blockTo)
    let max = Math.max(blockFrom, blockTo)
    if (min < index && index < max) {
      return ' │ '
    }

    return '   '
  }

  renderRegisterBar() {
    if (!this.loadedRegisterBar) {
      this.loadedRegisterBar = true
      this.barRegs = console.draft('...')
      this.barBooks = console.draft('...')
      this.barStatus = console.draft('...')
      this.barCmd = console.draft('...')
    }

    // Register bar
    let bar = chalk.bgBlack.white(' REGISTERS ')

    for (let color in this.registers) {
      let value = this.registers[color]
      let reg = chalk.black.bgRgb(...this.color2RGB(color))(` ${value} `)

      if (this.currentRegister == color)
        reg = chalk.underline(reg)
      
      bar += reg
    }

    // Bookmarks bar
    let bookm = chalk.bgBlack.white(' BOOKMARKS ')
    let books = ['PURPLE','BEIGE','DGREEN','LGREEN','BROWN','BLUE','RED']

    for (let color of books) {
      let value = this.bookmarks[color] ? '✔' : '✖'
      let reg = chalk.black.bgRgb(...this.color2RGB(color))(` ${value} `)

      bookm += reg
    }

    // Status Bar (Line, Current register, ...)
    let status = ''
    status += chalk.bgBlack.white(' LINE ')

    let line = (this.lastCommand < 10 ? ' ' : '') + this.lastCommand
    status += chalk.bgBlackBright.white(` ${line}  `)

    status += chalk.bgBlack.white(' REG: ')
    status += chalk.bgRgb(...this.color2RGB(this.currentRegister))('   ')
    
    // Current Command Bar
    let cmd = ''
    cmd += chalk.bgBlack.white(' COMMAND ')

    let command = this.currentCommand
    let commandName = command
    if (command && !_.isString(command))
      commandName = Lexer.name(command)
    cmd += chalk.bgBlackBright.white(` ${commandName}  `)

    this.barRegs(bar)
    this.barBooks(bookm)
    this.barStatus(status)
    this.barCmd(cmd)
  }

  renderBlockCommand(command) {
    if (command.rendered)
      return command.rendered

    let first = chalk.bgRgb(...this.color2RGB(command[0]))('  ')
    // check if begin of code
    let second
    if(command[1])
      second = chalk.bgRgb(...this.color2RGB(command[1]))('  ')
    else
      second = first

    let rendered = first + second

    command.rendered = rendered
    return rendered
  }

  renderJump(from, to) {
    this.blockFrom = from
    this.blockTo = to
    this.draw()
  }

  renderArrowState(active) {
    let arrow = '➜ '
    if (active)
      arrow = chalk.white(arrow)
    else
      arrow = chalk.dim(arrow)
    return arrow
  }

  color2RGB(color) {
    return {
      'RED': [255, 20, 20],
      'WHITE': [255, 255, 255],
      'PURPLE': [128, 0 , 128],
      'LGREEN': [153, 255, 51],
      'DGREEN': [0, 153, 0],
      'BROWN': [102, 51, 0],
      'BEIGE' : [255, 204, 53],
      'ORANGE': [255, 128, 0],
      'BLUE': [70, 153, 255]
    }[color] || [0,0,0]
  }
}
