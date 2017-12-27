# Turin-Bot
A color based programming language, just like Assembly - But easier

## Why

Because materializing a visual turing machine can help people understand how dumb machines are in fact.

![alt text](Screen%20Shot%202017-08-09%20at%202.56.51%20AM.png)

## Watch it: [Facebook Video](https://www.facebook.com/IvanSeidel/videos/vb.100001449630393/1555834834474823/?type=2&video_source=user_video_tab)

## How does it works?

There is a physical "Cursor" that has a `Stepper Motor`, and pushes forwards and backwards the `Program`: LEGO pieces joined together by forming a `Color String` that represents our program. The robot has two `Color sensors`, one on each side to read the current color of the string, and a `End-Switch` to know when the program has ended (our "tail" detector)

The Cursor only does actions demanded by the controller, that runs on the computer. The computer has all the logic in it to know what to do with what, just like a turing machine or a processor. It's like an interpreter, but it can also do compilations (from color-code to Assembly x86)

The last part is the Robot. It has two wheels and a ultrasonic sensor. The robot is from [another project](https://github.com/ivanseidel/PRIMO). It communicates trough `Bluetooth` with the computer, and execute commands as told.

In the end, we have a `Cursor` reading the code and commanding, just like the `Robot's` Processor, but in real time and with real code breaks (yeah, when things goes wrong the LEGO code string breaks).


## Moving Parts

This project consists of a few parts.
- An **Robot** that can move around LEGO pieces and read colors with an Arduino. It can `Beep`, `Go Fron`, `Go Left`, `Go Right`, `Read Distance Sensor`.
- A **Constroller** NodeJS program that reads from USB Serial and sends commands to it (just like a real cursor: `Next`, `Pervious`, `Read Head`, `Reset Head`)
- A **Virtual Machine**. We made the real one become virtual as well. You can call it the "Virtual Real Virtual Machine", because its in fact a Virtual machine of the Real Virtual Machine (got it?)
- The **Lexer**. Internally, we analize each "Symbol" with this. Language is translated into "strings" (or *bytecode*)
- The **Cursor**. We have the *CursorFile*  and the *CursorReal*. When testing, *CursorFile* comes in handy.
- The **RobotVirtual** or **RobotReal** are the actual implementation of the interface "Robot". Everythings goes in it (go to front, rotate, read ultrasonic sensor, etc...)
- Finally, the **Compilers**. Although this project is more of an "interpreter" as it executes in sync with the cursor reading the code, we made a compiler to ASM x86. The compiler is inside a folder, and can be used to increase your skills in understanding how compilation is done (a real simple one, but it counts)

## Wha can I do with the language?

Loops, "Function" calls, maths, for's, if's.

Here is the list of possible commands with their code


## About Contributing

Hey, we are not there yet! We still need documentation and a cleanup on few files. 

You can also help creating compilers to other languages than Assembly.

Don't forget to star the repo and spread the word about it
