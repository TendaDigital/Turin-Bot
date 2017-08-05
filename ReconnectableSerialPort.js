const _ = require('lodash')
const EventEmitter = require('events')

const SerialPort = require('serialport')
const Ready = SerialPort.parsers.Ready
const Readline = SerialPort.parsers.Readline

module.exports = class ReconnectableSerialPort extends EventEmitter{

  constructor(pattern) {
    super()

    this.port = null
    this.pattern = pattern

    // Configure readline parser
    // this.ready = new Ready({data: 'init'})
    
    this.readLine = new Readline()
    this.ready = new Ready({
      delimiter: 'init',
    })
    
    this.readLine.on('data', (data) => { this.emit('data', data) })
    this.ready.on('ready', () => { this.emit('ready') })

    // Init attempt to connect
    this.attemptConnect()
    this.keepTrying()
  }

  write(data) {
    if (!this.connected())
      return false

    this.port.write(data)
  }

  async attemptConnect() {
    if (this.connected()) {
      return true
    }

    // List all serial ports
    let boards = await SerialPort.list()

    // Find board
    let board = _.find(boards, this.pattern)

    if (!board)
      return false

    // Save connection
    this.port = await new SerialPort(board.comName, {baudRate: 115200});

    // Listen to close event
    this.port.on('close', () => { this.keepTrying() })

    // Pipe stream to readline
    this.port.pipe(this.ready)
    this.port.pipe(this.readLine)

    // Rebind events
    _.forEach(['close', 'open', 'error'], (event) => {
      this.port.on(event, () => { this.emit(event) })
    })
    
    return this.port
  }

  keepTrying() {
    clearTimeout(this.timeout)

    if (this.connected()) {
      return
    }
    
    this.timeout = setTimeout(async () => {
      if ( await this.attemptConnect() )
        return

      this.keepTrying()
    }, 300)
  }

  connected() {
    if (!this.port)
      return false

    return this.port.isOpen || this.port.opening
  }
}