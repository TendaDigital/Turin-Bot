const SerialPort = require('./ReconnectableSerialPort')
const SerialCommandProtocol = require('./SerialCommandProtocol')
const sleep = ms => new Promise((res, rej) => setTimeout(res, ms))

let pattern = { serialNumber: 'AH03B7U8' }

let arduino = new SerialPort(pattern)
let protocol = new SerialCommandProtocol(arduino)

async function setup() {
  console.log('setup')
  while(1) {
    await protocol.execute('l')
    await sleep(100)
    await protocol.execute('h')
    await sleep(100)
  }
}


console.log('init')
arduino.on('ready', () => setup())


// arduino.on('data', (data) => {
//   console.log(data)
// })

// setTimeout(() => {
//   arduino.write('lol')
// }, 4000)
// const SerialPort = require('serialport')
// const Readline = SerialPort.parsers.Readline;
// const parser = new Readline();

// ;(async () => {
//   let ports = await SerialPort.list()
//   console.log(ports)

//   let port = await new SerialPort('/dev/tty.usbserial-AH03B7U8')
//   console.log('Listening...')

//   port.pipe(parser)
//   parser.on('data', (data) => {
//     console.log('got:', data.toString())
//   })

//   setInterval(() => {
//     port.write('ola, ' + Date.now())
//   }, 500)


//   port.on('close', () => {
//     console.log('closed connection')
//   })
// })()



// // async read() {

// // }