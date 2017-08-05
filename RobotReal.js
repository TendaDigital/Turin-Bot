const SerialPort = require('serialport')
const SerialChannel = require('./SerialChannel')

module.exports = class RobotReal {
  constructor (comPort) {
    this.port = new SerialPort(comPort, {
      baudRate: 115200,
    })

    // Ready promise
    this.promiseReady = new Promise((resolve, reject) => {
      this.port.on('open', () => resolve())  
    })

    this.channel = new SerialChannel(this.port)
  }

  // Resolves promise once connected
  ready() {
    return this.promiseReady
  }

  async front(){
    await this.channel.execute('f')
  }

  async left(){
    await this.channel.execute('r')
  }

  async right(){
    await this.channel.execute('l')
  }

  async beep(){
    await this.channel.execute('b')
  }

  async stop(){
    await this.channel.execute('s')
  }

  async read(){
    let response = await this.channel.execute('u')
    let distance = parseInt(response.split(':')[2]) || 100
    return distance < 15 ? 1 : 0
  }

}