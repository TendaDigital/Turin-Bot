const chalk = require('chalk')
const Lexer = require('./Lexer')

require('draftlog').into(console)

module.exports = class VM {
  constructor(cursorDelegate, robotDelegate) {
    this.cursor = cursorDelegate
    this.robot = robotDelegate
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

    // Render Register bar
    this.renderRegisterBar()
  }

  async run () {
    // find the beginning of the program
    this.cursor.goToStart()

    try {
      // while program not finished
      while(!this.cursor.finished()) {
        // read the command
        let command = this.currentCommand = await this.read()

        // check if commands is valid
        if (!Lexer.validate(command)) throw new Error("Invalid command!")

        //draw command
        await this.draw(true)

        // execute command
        await this.executeCommand(command)

        // Next cursor
        await this.next()
      }
    } catch (e) {
      console.log(e)
      this.cursos.halt()
    }
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
    while(this.lastCommand > this.bookmarks[bookmark]) {
      await this.previous()
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
      await this.next()
    }
  }

  async jumpTrue() {
    if(this.registers[this.currentRegister] != 0) {
      await this.next()
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
    await this.cursor.next()
    this.lastCommand++;
    this.draw()
  }

  async read() {
    let command = await this.cursor.read()

    // Create draft for this line if doesn't exists
    if (!(this.lastCommand in this.commands)) {
      let draft = console.draft('...')
      // Save original command inside draft
      draft.command = command
      this.commands[this.lastCommand] = draft
    }

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
    // Render Register bar
    this.renderRegisterBar()
    
    // Render commands
    for (let index in this.commands) {
      let command = this.commands[index]
      let arrow = '  '

      if (index == this.lastCommand) {
        arrow = this.renderArrowState(executing)
      }

      let block = this.renderBlockCommand(command.command)

      command(arrow + block)
    }
  }

  renderRegisterBar() {
    if (!this.loadedRegisterBar) {
      this.loadedRegisterBar = true
      this.barRegs = console.draft('...')
      this.barStatus = console.draft('...')
      this.barCmd = console.draft('...')
    }
    let updateRegisters = this.barRegs

    let bar = chalk.bgBlack.white(' REGISTERS ')

    for (let color in this.registers) {
      let value = this.registers[color]
      let reg = chalk.black.bgRgb(...this.color2RGB(color))(` ${value} `)

      if (this.currentRegister == color)
        reg = chalk.underline(reg)
      
      bar += reg
    }

    let updateStatus = this.barStatus
    let status = ''
    status += chalk.bgBlack.white(' LINE ')

    let line = (this.lastCommand < 10 ? ' ' : '') + this.lastCommand
    status += chalk.bgBlackBright.white(` ${line}  `)

    status += chalk.bgBlack.white(' REG: ')
    status += chalk.bgRgb(...this.color2RGB(this.currentRegister))('   ')
    
    let updateCmd = this.barCmd
    let cmd = ''
    cmd += chalk.bgBlack.white(' COMMAND ')

    let command = this.currentCommand
    let commandName = command ? Lexer.name(command) : '...'
    cmd += chalk.bgBlackBright.white(` ${commandName}  `)

    updateRegisters(bar)
    updateStatus(status)
    updateCmd(cmd)
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