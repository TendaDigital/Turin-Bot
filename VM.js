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

    // readed lines
    this.commands = []
    this.lines = []
  }

  async run () {
    // find the beginning of the program
    this.cursor.goToStart()

    try {
      // while program not finished
      while(!this.cursor.finished()) {
        // read the command
        let command = await this.cursor.read()

        // check if commands is valid
        if (!Lexer.validate(command)) throw new Error("Invalid command!")

        //draw command
        await this.draw(command)

        // execute command
        await this.executeCommand(command)

        // increment command number
        this.lastCommand++

        // go to next command
        await this.cursor.next();
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
      this.draw()
      await this.cursor.previous();
      this.lastCommand--;
    }
  } 

  selectRegister(register) {
    this.currentRegister = register
  }

  async readFromSensor() {
    this.registers[this.currentRegister] = this.robot.read()
  }

  incrementRegister() {
    this.registers[this.currentRegister]++
  }

  decrementRegister() {
    this.registers[this.currentRegister]--
  }

  async jumpFalse() {
    if(this.registers[this.currentRegister] == 0) {
      // increment lastCommand and move cursor
      this.lastCommand++
      await this.cursor.next()
      await this.draw(await this.cursor.read())
      
    }
  }

  async jumpTrue() {
    if(this.registers[this.currentRegister] != 0) {
      // increment lastCommand and move cursor    
      this.lastCommand++
      await this.cursor.next()
      await this.draw(await this.cursor.read())
    }
  }

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
  draw(command, text) {
    function color2RGB(color) {
      return {
        'WHITE': [255, 255, 255],
        'PURPLE': [128, 0 , 128],
        'LGREEN': [153, 255, 51],
        'DGREEN': [0, 153, 0],
        'BROWN': [102, 51, 0],
        'BEIGE' : [255, 204, 53],
        'ORANGE': [255, 128, 0],
        'BLUE': [153, 153, 255]
      }[color]
    }

    // whipe all commands
    this.commands.forEach(function (command) {
      command("  " + command.original)
    })

    // check if commands was already used
    if(this.commands[this.lastCommand] == null) {
      let first = chalk.bgRgb(...color2RGB(command[0]))('  ')
      // check if begin of code
      let second
      if(command[1]) second = chalk.bgRgb(...color2RGB(command[1]))('  ')
      else second = first
      this.commands[this.lastCommand] = console.draft('➜ ' + first + second)
      this.commands[this.lastCommand].original = first + second
      return
    }

    let original = this.commands[this.lastCommand].original
    this.commands[this.lastCommand]('➜ ' + original)
  }
}