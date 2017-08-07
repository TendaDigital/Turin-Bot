const _ = require('lodash')
const chalk = require('chalk')
const Lexer = require('../Lexer')

/*
  Outputs code to turin.asm
  Use the output code to run with:
  https://www.jdoodle.com/compile-assembler-nasm-online
 */

module.exports = class CompilerAssembly {
  constructor (cursor) {
    this.cursor = cursor

    // Array of strings
    this.sections = {}
  }

  async compile() {
    let cursor = this.cursor

    // Reset cursor state
    cursor.goToStart()

    // Reset tag queue
    this.lifecycle_end = []

    // Reset sections and code
    this.sections = {
      '; TurinBot Compiled Assembly': [],
      'section .data': [],
      'section .bss':  [],
      'section .text': [],
    }

    // Declare start entrance
    this.append_text([
      '\tglobal _start'
    ])

    // Declare registers
    this.append('section .bss', [
      '\tbuf resb 1       ; 1000-byte buffer (in data section)',
    ])

    this.append_data([
      '\t;Current Register',
      '\tregister db 0',
      '\t;Registers',
      '\tregisters db 0, 0, 0, 0, 0, 0, 0',
    ])


    // Declare robot functions
    _.each(['front', 'left', 'right', 'beep'], func => {
      this.append_function(`robot_${func}`, [
        ...this.declare_printString(`${func}`),
      ])
    })

    // Declare read cmd
    this.append_data(this.declare_string(
      'readQuestion',
      'Type in read answer (y/n):'))

    this.append_function('read', [
      ...this.declare_printString('readQuestion'),
      '\tmov  edx,1',
      '\tmov  ecx,buf     ;Save user input to buffer.',
      '\tmov  ebx,0        ;From stdin',
      '\tmov  eax,3        ;sys_read. Read what user inputs',
      '\tint  80h',

      '\tmov eax, registers',
      '\tadd eax, [register]',
      '\tmov [eax], byte 1',

      '\tmov cl, \'y\'',
      '\tcmp [buf],cl',

      '\tje read_FINALLY',
      '\tmov eax, registers',
      '\tadd eax, [register]',
      '\tmov [eax], byte 0',
      '\tread_FINALLY:',
    ])

    // Append _start as last section
    this.append('_start:', [])

    // Declare constant strings
    this.append_data(this.declare_string('hello', 'Running Code'))
    this.append_data(this.declare_string('front', 'robot: front'))
    this.append_data(this.declare_string('left',  'robot: left'))
    this.append_data(this.declare_string('right', 'robot: right'))
    this.append_data(this.declare_string('beep',  'robot: beep'))

    this.append_main(this.declare_printString('hello'))

    do { 
      // Read commands
      let line = await cursor.read()

      // Validate command
      let command = Lexer.findOperation(line)

      // Compile command
      this.compileCommand(command)
      
      // Next command
      await cursor.next()

      // Execute lifecycle callback
      let actions = [...this.lifecycle_end]
      this.lifecycle_end = []
      actions.forEach(action => action())
    } while ( !cursor.finished() )

    // Append exit codes
    this.append_main([
      '\t',
      '\tmov  eax, 1      ;sys exit',
      '\tint 0x80',
    ])

    let code = []

    for (let sectionName in this.sections) {
      let sectionCode = this.sections[sectionName]
      code.push(sectionName)
      // Push lines indented
      code.push(...sectionCode)
      code.push('')
    }

    return code.join('\n')
  }

  compileCommand(command) {
    if (command.fn == 'begin') {
      return this.append_main([
        '\t; begin main'
      ])
    } 

    if (command.fn == 'saveBookmark') {
      return this.append_main([
        `;${command.fn}:${command.args}`,
        `${command.args}:`
      ])
    } 

    if (command.fn == 'goToBookmark') {
      return this.append_main([
        `\t;${command.fn}:${command.args}`,
        `\tJMP SHORT ${command.args}`
      ])
    } 

    if (command.fn == 'front') {
      // Robot Action: Front
      return this.append_main([
        `\t;front`,
        ...this.declare_functionCall('robot_front')
      ])
    } 

    if (command.fn == 'left') {
      // Robot Action: Left
      return this.append_main([
        `\t;left`,
        ...this.declare_functionCall('robot_left')
      ])
    } 

    if (command.fn == 'right') {
      // Robot Action: Right
      return this.append_main([
        `\t;right`,
        ...this.declare_functionCall('robot_right')
      ])
    } 

    if (command.fn == 'beep') {
      // Robot Action: Beep
      return this.append_main([
        `\t;beep`,
        ...this.declare_functionCall('robot_beep')
      ])
    } 

    if (command.fn == 'readFromSensor') {
      return this.append_main([
        `\t;readFromSensor`,
        ...this.declare_functionCall('read')
      ])
    }

    if (command.fn == 'jumpTrue') {
      let n = this.sections['_start:'].length
      let target = `jumpTrue_${n}`
      this.append_main([
        '\t;jumpTrue',
        '\tmov eax, registers',
        '\tadd eax, [register]',
        '\tcmp [eax], byte 0',
        `\tjne ${target}`,
      ])

      // Append new tag to queue, to be inserted at the end of next cycle
      this.append_section_later(target)
      return
    }

    if (command.fn == 'jumpFalse') {
      let n = this.sections['_start:'].length
      let target = `jumpFalse_${n}`
      this.append_main([
        '\t;jumpFalse',
        '\tmov eax, registers',
        '\tadd eax, [register]',
        '\tcmp [eax], byte 0',
        `\tje ${target}`,
      ])

      // Append new tag to queue, to be inserted at the end of next cycle
      this.append_section_later(target)
      return
    }

    console.log(command.fn)
    this.append_main([
      (`\t;!!!!! MISSING !!!!!: ${command.fn}`)
    ])
  }

  append(group, lines) {
    // Create section if not existent
    if (! (group in this.sections))
      this.sections[group] = []

    this.sections[group].push(...lines)
  }

  append_main(lines) {
    this.append('_start:', lines)
  }

  append_data(lines) {
    this.append('section .data', lines)
  }

  append_text(lines) {
    this.append('section .text', lines)
  }

  append_function(method, lines) {
    this.append(`${method}:`, [
      `\t;function begin`,
      ...lines,
      `\tret`,
      `\t;end`,
    ])
  }

  declare_functionCall(method) {
    return [
      `\tcall ${method}`
    ]
  }

  // Adds a section 2 loops later
  append_section_later(section) {
    this.lifecycle_end.push(() => {
      this.lifecycle_end.push(() => {
        this.append_main([
          `\t;jumpTrue callback`,
          `\t${section}:`,
        ])
      })
    })
  }

  declare_string(name, value) {
    return [
      `\t; String ${name}`,
      `\t${name}: db '${value}',10`,
      `\t${name}Len: equ $-${name}`,
    ]
  }

  declare_string(name, value) {
    return [
      `\t; String ${name}`,
      `\t${name}: db '${value}',10`,
      `\t${name}Len: equ $-${name}`,
    ]
  }

  declare_printString(name) {
    return [
      `\t;Print variable ${name}`,
      '\tmov eax,4',
      '\tmov ebx,1',
      `\tmov ecx,${name}`,
      `\tmov edx,${name}Len`,
      `\tint 80h`,
    ]
  }
}