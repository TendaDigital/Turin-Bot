const chalk = require('chalk')
const SerialPort = require('serialport')
const SerialCommandProtocol = require('./SerialCommandProtocol')
const ReconnectableSerialPort = require('./ReconnectableSerialPort')
const sleep = ms => new Promise((res, rej) => setTimeout(res, ms))

SerialPort.list(console.log)

let arduinoPort = new ReconnectableSerialPort({ serialNumber: 'AH03B7U8' })
let arduino = new SerialCommandProtocol(arduinoPort)

let robotPort = new ReconnectableSerialPort({ comName: '/dev/tty.HC-05-DevB' })
let robot = new SerialCommandProtocol(robotPort)

async function runArduino() {
  console.log('arduino connection')
  while(1) {
    let now = Date.now()
    let exp = now % 10
    let raw = await arduino.execute(''+exp)
    let res = raw.split(':')[1]

    let out = `res: ${res} | ${Date.now() - now}ms`
    console.log(exp == res ? chalk.green(out) : chalk.red(out))
    // await arduino.execute('l')
    // await sleep(100)
    // await arduino.execute('h')
    // await sleep(100)
  }
}

async function runRobot() {
  console.log('robot connection')
  while(1) {
    await robot.execute('f')
  }
}


console.log('init')
robotPort.on('ready', () => runRobot())
arduinoPort.on('ready', () => runArduino())



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