class VM {
  constructor(cursorDelegate, robotDelegate) {
    this.cursor = cursorDelegate
    this.robot = robotDelegate
  }


  async run () {
    await this.cursor.reset()

    // Read current
    try {
      while (!await this.cursor.ended()) {      
        let command = await this.cursor.read()

        await executeCommand(command)
      }
    } catch (e) {
      this.cursor.halt()
    }
  }

  async executeCommand(command) {
    // TODO

    if (command == [ ])
      await this.robot.front()
  }
}