const fs = require('fs');
const sleep = require('./sleep')

module.exports = class CursorFile {
  constructor(path) {
    this.commands = fs.readFileSync(path).toString().split("\n")
    this.currentPosition = 0
  }

  goToStart() {
    this.currentPosition = 0
  }

  read() {
    return this.commands[this.currentPosition].split(':')
  }

  finished () {
    return this.currentPosition == (this.commands.length - 1)
  }

  async next() {
    await sleep(300)
    this.currentPosition++
  }

  async previous() {
    await sleep(300)
    this.currentPosition--
  }

  halt() {
    throw new Error("Something bad happened!")
  }
}