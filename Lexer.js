module.exports = class Lexer {
  constructor() {}

  static validCommands() {
      return {
        // header
        'WHITE': { fn: 'begin', args: null},
        'WHITE:WHITE': { fn: 'begin', args: null},
        // robot commands
        'DGREEN:DGREEN' : { fn: 'front', args: null},
        'RED:RED' :       { fn: 'right', args: null},
        'ORANGE:ORANGE' : { fn: 'left', args: null},
        'BLUE:BLUE' :     { fn: 'beep', args: null},
        // operate with last mentioned register
        'PURPLE:PURPLE' : { fn: 'readFromSensor', args: null},
        'PURPLE:BEIGE'  : { fn: 'incrementRegister', args: null},
        'PURPLE:ORANGE' : { fn: 'decrementRegister', args: null},
        'PURPLE:BLUE'   : { fn: 'jumpFalse', args: null},
        'PURPLE:RED'    : { fn: 'jumpTrue', args: null},
        // select a register
        'BROWN:PURPLE' : {fn: 'selectRegister', args: 'PURPLE'} ,
        'BROWN:BEIGE'  : {fn: 'selectRegister', args: 'BEIGE'} ,
        'BROWN:DGREEN' : {fn: 'selectRegister', args: 'DGREEN'} ,
        'BROWN:LGREEN' : {fn: 'selectRegister', args: 'LGREEN'} ,
        'BROWN:ORANGE' : {fn: 'selectRegister', args: 'ORANGE'} ,
        'BROWN:BLUE'   : {fn: 'selectRegister', args: 'BLUE'} ,
        'BROWN:RED'    : {fn: 'selectRegister', args: 'RED'} ,
        // save bookmark
        'ORANGE:PURPLE' : {fn: 'saveBookmark', args: 'PURPLE'}, 
        'ORANGE:BEIGE'  : {fn: 'saveBookmark', args: 'BEIGE'},
        'ORANGE:DGREEN' : {fn: 'saveBookmark', args: 'DGREEN'}, 
        'ORANGE:BROWN'  : {fn: 'saveBookmark', args: 'BROWN'},
        'ORANGE:BLUE'   : {fn: 'saveBookmark', args: 'BLUE'},
        'ORANGE:RED'    : {fn: 'saveBookmark', args: 'RED'},
        // goto saved bookmark
        'LGREEN:PURPLE' : {fn: 'goToBookmark', args: 'PURPLE'},
        'LGREEN:BEIGE'  : {fn: 'goToBookmark', args: 'BEIGE'},
        'LGREEN:DGREEN' : {fn: 'goToBookmark', args: 'DGREEN'},
        'LGREEN:LGREEN' : {fn: 'goToBookmark', args: 'LGREEN'},
        'LGREEN:BROWN'  : {fn: 'goToBookmark', args: 'BROWN'},
        'LGREEN:BLUE'   : {fn: 'goToBookmark', args: 'BLUE'},
        'LGREEN:RED'    : {fn: 'goToBookmark', args: 'RED'},
      }
    }

  static validate(command) {
    return command.join(":") in Lexer.validCommands()
  }

  static findOperation(command) {
    return Lexer.validCommands()[command.join(":")]
  }

  static name(command) {
    let op = Lexer.findOperation(command)
    return op.fn + (op.args ? '→' + op.args : '')
  }
}