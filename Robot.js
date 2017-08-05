class Robot {
  constructor (serialPort) {
    this.serialPort = serialPort
  }

  async front() {
    await this.serialPort.execute('f')
  }

  async left() {
    await this.serialPort.execute('l')
  }

  async right() {
    await this.serialPort.execute('r')
  }

  async readSensor() {
    // need to parse this
    return await this.serialPort.execute('s')
  }
}