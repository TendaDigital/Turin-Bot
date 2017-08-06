const sleep = ms => new Promise((res, rej) => setTimeout(res, ms))

module.exports = class RobotVirtual {
  constructor () {
    // Ready promise
    this.promiseReady = new Promise((resolve, reject) => {
      resolve()
    })
  }

  // Resolves promise once connected
  ready() {
    return this.promiseReady
  }

  async front(){
    await sleep(800)
  }

  async left(){
    await sleep(800)
  }

  async right(){
    await sleep(800)
  }

  async beep(){
    await sleep(300)
  }

  async stop(){
    await sleep(100)
  }

  async read(){
    return Math.random() > 0.5 ? 1 : 0
  }

}