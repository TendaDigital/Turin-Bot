const chalk = require('chalk')
const SerialPort = require('serialport')
const SerialCommandProtocol = require('./SerialCommandProtocol')
const ReconnectableSerialPort = require('./ReconnectableSerialPort')
const sleep = ms => new Promise((res, rej) => setTimeout(res, ms))

require('draftlog').into(console)

// SerialPort.list(console.log)

let arduinoPort = new ReconnectableSerialPort({ serialNumber: 'AH03B7U8' })
let arduino = new SerialCommandProtocol(arduinoPort)

let robotPort = new ReconnectableSerialPort({
  comName: '/dev/tty.JOAO_S2_IVAN-DevB'
}, {
  baudRate: 115200,
})


let meudraft = console.draft('Ola, tudo bem?')

let colors = [
  ['Black', 'Black'],
  ['White', 'White'],
  ['Green', 'Red'],
  ['Blue', 'Blue'],
  ['Yellow', 'Blue'],
  ['Yellow', 'Blue'],
  ['Yellow', 'White'],
  ['White', 'White'],
  ['Black', 'Black'],
]


let lines = []
for (let color of colors) {
  let line = chalk['bg'+color[0]](' s ') + chalk['bg'+color[1]]('  ')
  // line = chalk.bgWhite('     '+line+'     ')
  let draft = console.draft(line)
  draft.original = line
  lines.push(draft)
}



;(async () => {
  let test = console.draft('hmmm')
  let i = 0
  // for (let i = 0; i < lines.length; i++) {
  while(1){
    await sleep(50)
    test(chalk.bgRgb((i+=2) % 255, 100, 150)('                       '))
    // let draft = lines[i]
    // restore()
    // draft(draft.original + ' <')
  }
  // meudraft('Atualizei!')
})()

function restore() {
  for (let line of lines) {
    line(line.original)
  }
}



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
    await robot.execute('r')
    console.log('ended!')
    await robot.execute('b')
    await sleep(1000)
  }
}


console.log('init')
robotPort.on('open', () => runRobot())
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