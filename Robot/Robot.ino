/*
  Controls Cubetto

  For instructions, go to https://github.com/ivanseidel/Primo

  Created by Ivan Seidel Gomes, September, 2014.
  Released into the public domain.

  Dependencies
  I used a few libraries to make the code Reliable, Generic,
  and easy to change if anyone needs it.

  It is based on my other Library called ArduinoThreads
  (http://GitHub.com/ivanseidel/ArduinoThread).

  I also used AccelStepper
  (http://www.airspayce.com/mikem/arduino/AccelStepper/)
  to control the Stepper motor.

  Make sure to have them installed.
  
  It might look like a lot of things for get this going, but the
  goal is do do even more complex things with time, including: If’s,
  Whiles, Wait blocks (Wait for Sound, Wait for touch…).

  Have fun =)
*/

#include <math.h>

#include <Thread.h>
#include <ThreadController.h>

#include <Wire.h>

#include "PID.h"


// 
// PINS
// 
#define PIN_RADIO_CE  9
#define PIN_RADIO_CSN 10

#define PIN_BUZZER    A2

#define PIN_US_TRIG   A0
#define PIN_US_ECHO   A1

#define PIN_MOT_EN    8

#define PIN_MOT_A1    4
#define PIN_MOT_A2    5

#define PIN_MOT_B1    7
#define PIN_MOT_B2    6


// 
// Motor definitions (set to -1 or 1 to invert)
// 
#define MA_DIR    -1
#define MB_DIR    -1



// 
// Command Definitions
// 
#define DISCONNECTED 0
#define CONNECTED    1

#define CONNECTION_TIMEOUT  5000 // 5 seconds

#define CMD_PING    'p'
#define CMD_BEEP    'b'
#define CMD_OK      'k'
#define CMD_READ_US 'u'
#define CMD_FRONT   'f'
#define CMD_LEFT    'l'
#define CMD_RIGHT   'r'
#define CMD_STOP    's'
#define CMD_FRONT_WAIT  '-'

// 
// Controll stuff
// 
float orientation = 0;

#define MIN_PWM_POWER 80
#define FRONT_POWER   70
#define FRONT_TIME    1400


// 
// Gyroscope definition
// 
int L3G4200D_Address = 105;
int L3G4200D_Scale = 2000;
struct {
  float x;
  float y;
  float z;
} gyro;


// 
// General State
// 
unsigned long lastPktTime = 0;
int lastPkt;
int runningCmd = 0;
int cmdState = 1;


// 
// CPU
// 
ThreadController CPU;


// 
// Motors
// 
void setSpeed(int mA, int mB){
  if(!mA && !mB){
    // Disable
    digitalWrite(PIN_MOT_EN, LOW);
    return;
  }

  digitalWrite(PIN_MOT_EN, HIGH);

  // Limit Powers
  mA = (mA >  100 ?  100 : mA);
  mA = (mA < -100 ? -100 : mA);

  mB = (mB >  100 ?  100 : mB);
  mB = (mB < -100 ? -100 : mB);

  // Convert to PWM
  mA = MA_DIR * mA * (255 / 100.0);
  mB = MB_DIR * mB * (255 / 100.0);

  if(mA > 0 && mA <  MIN_PWM_POWER)
    mA = MIN_PWM_POWER;
  if(mA < 0 && mA > -MIN_PWM_POWER)
    mA = -MIN_PWM_POWER;


  if(mB > 0 && mB <  MIN_PWM_POWER)
    mB = MIN_PWM_POWER;
  if(mB < 0 && mB > -MIN_PWM_POWER)
    mB = -MIN_PWM_POWER;

  // Set PWM
  if(mA > 0){
    digitalWrite(PIN_MOT_A1, LOW);
    analogWrite(PIN_MOT_A2, mA);
  }else{
    digitalWrite(PIN_MOT_A1, HIGH);
    analogWrite(PIN_MOT_A2, 255 + mA);
  }

  if(mB > 0){
    digitalWrite(PIN_MOT_B1, LOW);
    analogWrite(PIN_MOT_B2, mB);
  }else{
    digitalWrite(PIN_MOT_B1, HIGH);
    analogWrite(PIN_MOT_B2, 255 + mB);
  }
}


// 
// Does beeping stuff
// 
int beeps = 1;
Thread ThreadBeep(thrDoBeep, 50);
void thrDoBeep(){
  static bool isBeeping = false;
  static bool lastIsBeeping = false;

  if(beeps > 0){
    isBeeping = !isBeeping;

    // Decrease beeps at each beep
    if(!isBeeping)
      beeps--;


    ThreadBeep.setInterval(isBeeping ? 100 : 50);
  }

  if(lastIsBeeping != isBeeping){
    digitalWrite(PIN_BUZZER, isBeeping);
    lastIsBeeping = isBeeping;
  }
}


// 
// Reads the Ultrasonic sensor
// 
int didLongSampling = 0;
int distanceCM = 30;
unsigned long timeUs;
Thread ThreadUltrasonic(thrUltrasonic, 100);
void thrUltrasonic(){

  // Skip if not in CMD_FRONT_WAIT
  // if(runningCmd != CMD_FRONT_WAIT){
  //   distanceCM = 30;
  //   return;
  // }

  digitalWrite(PIN_US_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_US_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_US_TRIG, LOW);

  unsigned long timeout = 5000;

  // if(timeUs == 0 && !didLongSampling){
  //   timeout = 10000;
  //   Serial.println("long sample!");

  //   didLongSampling = 1;
  // }

  timeUs = pulseIn(PIN_US_ECHO, HIGH, timeout);

  // if(distanceCM < 15 && timeUs == 0){
    // if(didLongSampling)
      // distanceCM = 0;
  // }else 
  if(timeUs <= 0){
    // if(didLongSampling)
    distanceCM = 100;
  }else{
    distanceCM = min(timeUs / 27.6233 / 2.0, 50);
    // didLongSampling = 0;
  }
}


// 
// Thread to Execute Motor commands
// 

// Rotation stuff
float targetSetpoint = 0;

float targetSpeed = 0;
float runDuration = 0;

unsigned long runningSpeedEnd = 0;

PID rotationPID(0.8, 10, 0, 2);
PID frontPID(0.8, 10, 0, 2);

Thread RobotThread(thrControllRobot, 5);
void thrControllRobot(){
  static int debug = 0;
  static int canStop = 0;
  static int currentPkt = 0;
  static unsigned long now = 0;
  static unsigned long lastGotTime = 0;

  static unsigned long lastUnstable = 0;

  if(cmdState != 0)
    return;

  // Check if it's the first time it runs the command
  if(currentPkt != lastPkt){
    lastPkt = currentPkt;

    // Set target setpoint of speed and rotation
    targetSpeed = 0;
    runDuration = 0;
    float deltaDegrees = 0;

    if(runningCmd == CMD_FRONT || runningCmd == CMD_FRONT_WAIT)
      targetSpeed = FRONT_POWER;

    if(runningCmd == CMD_LEFT)
      deltaDegrees = -93;

    if(runningCmd == CMD_RIGHT)
      deltaDegrees =  93;

    targetSetpoint = orientation + deltaDegrees;

    runningSpeedEnd = millis();

    if(runningCmd == CMD_FRONT)
      runningSpeedEnd += FRONT_TIME;

    canStop = 0;

    Serial.print("Set target: ");
    Serial.print(targetSetpoint);
    Serial.println();

    frontPID.setTarget(targetSetpoint);
    frontPID.reset();
    rotationPID.setTarget(targetSetpoint);
    rotationPID.reset();
  }

  // Calculate dt
  now = millis();
  float dt = (now - lastGotTime) / 1000.0;
  lastGotTime = now;

  // Verify if it can integrate
  if(dt > 0.05){
    // Serial.println("! dt > 0.05s");
    return;
  }

  // Calculate PID
  float pid = 0;
  if (runningCmd == CMD_FRONT) {
    pid = frontPID.update(orientation, dt);
  } else {
    pid = rotationPID.update(orientation, dt);
  }

  // LEFT/RIGHT can always stop
  if(runningCmd == CMD_RIGHT || runningCmd == CMD_LEFT)
    canStop = true;

  // Check if target walk time expired
  if(runningCmd == CMD_FRONT && now > runningSpeedEnd){
    targetSpeed = 0;
    canStop = true;
  }

  // Check if reached wall
  if(runningCmd == CMD_FRONT_WAIT && distanceCM < 15){
    targetSpeed = 0;
    canStop = true;
  }

  // Check if reached target
  if (debug++ % 10 == 0) {
    Serial.print("target:");
    Serial.println(orientation - targetSetpoint);
  }
  if(abs(pid) < 5 && abs(orientation - targetSetpoint) < 2 && canStop){
    
    setSpeed(0,0);
    
    if(now - lastUnstable > 500){
      Serial.println("Target reached!");
      cmdState = 1;

      // Send end cmd
      Serial.print(":");
      Serial.write(runningCmd);
      Serial.println(":ok");
    }

  }else{
    lastUnstable = now;

    setSpeed(targetSpeed + pid, targetSpeed - pid);
  }
}


// 
// Responsible for checking connection
// 
int state = DISCONNECTED;
unsigned long lastPing = 0;

Thread ConnectionCheck(thrConnectionCheck, 500);
void thrConnectionCheck(){
  
  if(state == CONNECTED && millis() - lastPing > CONNECTION_TIMEOUT){
    // Change to DISCONNECTED
    state = DISCONNECTED;
    Serial.println("DISCONNECTED");

    beeps = 1;

  }else if(state == DISCONNECTED && lastPing > 0 && millis() - lastPing <= CONNECTION_TIMEOUT){
    // Change to CONNECTED
    state = CONNECTED;
    Serial.println("CONNECTED");

    beeps = 2;
  }
  
}


// 
// Gyroscope integration process (Absolute angle)
// 
float gyroOffset = 0;
float learnFactor = 0.01;

Thread ThreadOrientation(thrOrientation, 2);
void thrOrientation(){
  static int debug = 0;
  static unsigned long now = 0;
  static unsigned long lastGotTime = 0;

  // Read Gyro
  getGyroValues();

  // Calculate dt
  now = micros();
  float dt = (now - lastGotTime) / 1000000.0;
  lastGotTime = now;

  // Verify if it can integrate
  if(dt > 0.05){
    //Serial.println("! dt > 0.05s");
    return;
  }

  // 
  // Autocalibrate continuously
  // 

  // Integrate data over Z data
  float dGyro = (gyro.z - gyroOffset) * dt;
  orientation += dGyro;

  // Autocalibrate (goes from 0 to 1)
  float newOffsetWeigth = min(abs(gyro.z / 1.5), 1.0);

  // Current offset weight (0 to 1)
  float currentOffsetWeight = min(abs(gyroOffset / 3.0), 1.0);

  // Calculate how to add
  float addToOffsetWeigth = sqrt((1 - newOffsetWeigth) * (1 - currentOffsetWeight));

  // Add
  gyroOffset += (gyro.z - gyroOffset) * addToOffsetWeigth * learnFactor;

  // if(debug % 10 == 0){
  //   Serial.print(" angle: ");
  //   Serial.print(orientation);
  //   Serial.print(" offset: ");
  //   Serial.print(gyroOffset);
  //   Serial.print(" gyro: ");
  //   Serial.print(gyro.z);
  //   Serial.println();
  // }
}

// 
// Read command and execute (executes in parallel)
// 
Thread CommandReader(thrCommandReader, 0);
void thrCommandReader(){
  if(!Serial.available())
    return;

  int cmd = Serial.read();

  // Cancel last cmd
  if (cmdState == 0) {
    Serial.print(":");
    Serial.write(runningCmd);
    Serial.println(":cancel");
    setSpeed(0, 0);
  }

  // Save state of robot
  cmdState = 1;
  lastPktTime = millis();

  // Command: PING
  if (cmd == CMD_PING) {
    Serial.print(":");
    Serial.write(cmd);
    Serial.println(":ok");
    return;
  }

  // Command: Beep robot
  if (cmd == CMD_BEEP) {
    // Beeps
    digitalWrite(PIN_BUZZER, HIGH);
    delay(200);
    digitalWrite(PIN_BUZZER, LOW);
    delay(100);
    
    Serial.print(":");
    Serial.write(cmd);
    Serial.println(":ok");
    return;
  }

  // Command: Return sensor reading
  if (cmd == CMD_READ_US) {
    thrUltrasonic();

    Serial.print(":");
    Serial.write(cmd);
    Serial.print(":");
    Serial.println(distanceCM);
    return;
  }

  // Command: Stop Robot
  if (cmd == CMD_STOP) {
    setSpeed(0, 0);

    Serial.print(":");
    Serial.write(cmd);
    Serial.println(":ok");
    return;
  }

  // Command: Checks if one of remaining async commands
  if (cmd != CMD_FRONT && cmd != CMD_LEFT && cmd != CMD_RIGHT) {
    Serial.print(":");
    Serial.write(cmd);
    Serial.println(":invalidCmd");
    return;
  }

  // Send state to Robot Controller
  lastPkt++;
  cmdState = 0;
  runningCmd = cmd;

  // Return data
  //  send(runningCmd, 0, cmdState);
  Serial.print("asyncCmd:");
  Serial.write(cmd);
  Serial.println();
}

void setup() {

  // Serial Setup
  Serial.begin(115200);

  // Init I2C
  Wire.begin();

  // Setup Gyroscope
  setupL3G4200D(L3G4200D_Scale);

  // Configure PINS
  pinMode(13, OUTPUT);
  pinMode(PIN_US_TRIG, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_MOT_EN, OUTPUT);
  pinMode(PIN_MOT_A1, OUTPUT);
  pinMode(PIN_MOT_A2, OUTPUT);
  pinMode(PIN_MOT_B1, OUTPUT);
  pinMode(PIN_MOT_B2, OUTPUT);
    
  // Setup CPU
  CPU.add(&CommandReader);
  CPU.add(&ThreadBeep);
  CPU.add(&ThreadUltrasonic);
  CPU.add(&ConnectionCheck);
  CPU.add(&ThreadOrientation);
  CPU.add(&RobotThread);

  // Ping Serial
  Serial.println("init");
}

void loop() {
  CPU.run();
}

