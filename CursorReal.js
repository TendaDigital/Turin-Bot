const _ = require('lodash');
const fs = require('fs');
const inquirer = require('inquirer')
const SerialPort = require('serialport')

const sleep = require('./sleep')
const CursorFile = require('./CursorFile')
const SerialChannel = require('./SerialChannel')

module.exports = class CursorReal extends CursorFile{
  constructor(comPort) {
    // super('examples/collision.turin', 0)
    super('examples/collision.turin', 0)

    this.port = new SerialPort(comPort, {
      baudRate: 115200,
    })

    // Ready promise
    this.promiseReady = new Promise((resolve, reject) => {
      this.port.on('open', () => setTimeout(() => resolve(), 2000))
    })

    this.channel = new SerialChannel(this.port, {
      // debug: true
    })
  }

  static async getPort(prefered) {
    let ports = await SerialPort.list()
    let found = _.find(ports, {comName: prefered})
    if (found)
      return prefered

    console.log(`Port '${prefered}' not available`)

    let answer = await inquirer.prompt({
      type: 'list', 
      name: 'port',
      choices: _.map(ports, 'comName'),
      message: 'Select Cursor port'
    })

    return answer.port
  }

  async ready() {
    return this.promiseReady
  }

  async goToStart() {
    await this.channel.execute('r')
    await super.goToStart()
  }

  async read() {
    return await super.read()
  }

  async next() {
    let result = await this.channel.execute('n')
    result = result.replace(':n:', '')

    await super.next()

    if (result != 'ok')
      return false
    
    return true
  }

  async previous() {
    let result = await this.channel.execute('b')
    result = result.replace(':b:', '')

    if (result != 'ok')
      throw new Error('Failed to go to previous: '+result)

    await super.previous()
  }

  halt() {
    throw new Error("Something bad happened!")
  }
}