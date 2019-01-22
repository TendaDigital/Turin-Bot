const _ = require('lodash');
const fs = require('fs');
const inquirer = require('inquirer')
const SerialPort = require('serialport')

const sleep = require('./sleep')
const CursorFile = require('./CursorFile')
const SerialChannel = require('./SerialChannel')

module.exports = class CursorReal{
  constructor(comPort) {
    // super('examples/collision.turin', 0)
    // super('examples/collision.turin', 0)

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
    // await super.goToStart()
  }

  async read() {
    let raw = await this.channel.execute('c')
    let color1 = raw.split(':')[2]
    let color2 = raw.split(':')[3]
    return [parseHexToColor(color1), parseHexToColor(color2)]
  }

  async next() {
    let result = await this.channel.execute('n')
    result = result.replace(':n:', '')


    if (result != 'ok') {
      return false
    }

    return true

    // return await super.next()
  }

  async previous() {
    let result = await this.channel.execute('b')
    result = result.replace(':b:', '')

    if (result != 'ok')
      throw new Error('Failed to go to previous: '+result)

    // await super.previous()
  }

  halt() {
    // throw new Error("Something bad happened!")
  }
}

const colors = {
  'EMPTY':  hex2rgb('B64A4A'),

  'RED':    hex2rgb('C03830'),
  'BLUE':   hex2rgb('416754'),
  'BEIGE':  hex2rgb('63642D'),
  'WHITE':  hex2rgb('5C6435'),
  'BROWN':  hex2rgb('755731'),
  'PURPLE': hex2rgb('5C5866'),
  'LGREEN': hex2rgb('577825'),
  'DGREEN': hex2rgb('3C8E3B'),
  'ORANGE': hex2rgb('9A4420'),
}



function parseHexToColor(hex) {
  let rgb = hex2rgb(hex)

  let bestDiff = 100000
  let bestColor = null
  for (let i in colors) {
    let color = colors[i]
    let diff = diffColors(rgb, color)

    if (diff > bestDiff)
      continue

    bestDiff = diff
    bestColor = i
  }

  return bestColor
}

function diffColors(c1, c2) {
  return  Math.sqrt(
            Math.pow(c1[0] - c2[0], 2) + 
            Math.pow(c1[1] - c2[1], 2) + 
            Math.pow(c1[2] - c2[2], 2))
}

function hex2rgb(hex) {
  if (typeof hex !== 'string') {
    throw new TypeError('Expected a string');
  }

  hex = hex.replace(/^#/, '');

  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  var num = parseInt(hex, 16);

  return [num >> 16, num >> 8 & 255, num & 255];
};