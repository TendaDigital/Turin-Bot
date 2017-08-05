const _ = require('lodash')
const Readline = require('serialport').parsers.Readline

module.exports = class SerialChannel {
  constructor(serialPort) {
    this.promiseQueue = []
    this.serialPort = serialPort

    // Bufferize Line and use as dataReceived
    let lineBuffer = new Readline({
      delimiter: '\r\n',
    })
    serialPort.pipe(lineBuffer)
    lineBuffer.on('data', (data) => this.dataReceived(data))

    serialPort.on('open', () => this.resetQueue())
    serialPort.on('close', () => this.resetQueue())
  }

  resetQueue() {
    let promise
    while(promise = this.promiseQueue.shift())
      promise.reject('Connection opening')
    // this.promiseQueue = []
  }

  dataReceived(data) {
    if (!data)
      return

    // Make sure it's a string
    data = data.toString()

    // Only packets starting with `:` are responses
    if (!data.startsWith(':')) {
      // console.log('>', data)
      return
    }
    
    // console.log('end: ', data)

    let promise = this.promiseQueue.shift()
  
    if (!promise)
      return

    promise.resolve(data)
  }

  execute(command) {
    this.serialPort.write(command)
    let promise = new Promise((resolve, reject) => {
      let queued = {resolve, reject}
      this.promiseQueue.push(queued)

      // Timeout command
      setTimeout(() => {
        // Remove from queue
        _.pull(this.promiseQueue, queued)

        // Reject
        reject('Timeout action')
      }, 5000)
    })

    return promise
  }

}