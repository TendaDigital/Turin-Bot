const _ = require('lodash')

module.exports = class SerialCommandProtocol {
  constructor(serialPort) {
    this.promiseQueue = []
    this.serialPort = serialPort
    serialPort.on('data', (data) => this.dataReceived(data))
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