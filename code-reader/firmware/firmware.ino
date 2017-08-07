#include <EEPROM.h>

//#define DEBUG

//////// PORT DECLARATION
int dir =5;
int enable = 8;
int stepPin=4;
int endSwitch = 2;

//////// CONTROL VARIABLES
bool footer = false;

//////// STEPPER VARIABLES

float stepToMm = 0.023;
float desiredLengthMm = EEPROM.read(0)/25.0;
int stepsPerBlock = desiredLengthMm/stepToMm;
#define SPEED 100
int ACCEL_STEPS = 40;
int ACCEL_DELAY = 500;

/////// Block Index
int blocks = 0;
int endIndex =0;
bool endBlock = false;

//////// Accepts Serial Commannds
void writeOK(char cmd){
  Serial.print(":");
  Serial.write(cmd);
  Serial.println(":ok");
}

//////// ERROR on Serial
void writeNOK(char cmd){
  Serial.print(":");
  Serial.write(cmd);
  Serial.println(":error");
}
void writeYes(char cmd){
  Serial.print(":");
  Serial.write(cmd);
  Serial.println(":yes");
}
void writeNo(char cmd){
  Serial.print(":");
  Serial.write(cmd);
  Serial.println(":no");
}

//////// Creates Acceleration using delay
int delayForCompletion(int step, int total){
  if (step < ACCEL_STEPS){
    delayMicroseconds(ACCEL_DELAY - step / (float) ACCEL_STEPS * ACCEL_DELAY + SPEED);
    return;
  }
  if (step > total - ACCEL_STEPS) {
    step = (ACCEL_STEPS - (total - step));
    delayMicroseconds(ACCEL_DELAY - step / (float) ACCEL_STEPS * ACCEL_DELAY + SPEED);
    return;
  }

  delayMicroseconds(SPEED);
}

//////// Move to the next Block
bool nextBlock(int walks=1){
  int toWalk = stepsPerBlock * walks;
  int i;
  for(i=0; i < toWalk; i++){
    if(footer){
      break;
    }
    digitalWrite(dir, LOW);
    digitalWrite(enable, LOW);
    digitalWrite(stepPin, HIGH);
    delayForCompletion(i, toWalk);
    digitalWrite(stepPin, LOW);
    delayForCompletion(i, toWalk);
  }
  if(i < toWalk){                   // Checks to see if there's need to go back to last brick
    noInterrupts();
    digitalWrite(dir, HIGH);
    digitalWrite(enable, LOW);
    for(; i >= 0; i--){
      digitalWrite(stepPin, HIGH);
      delayMicroseconds(1000);
      digitalWrite(stepPin, LOW);
      delayMicroseconds(1000);
    }
    endBlock = true;
    endIndex = blocks;

    interrupts();
    delay(10);
    footer=false;
    return false;

  }
  return true;
}

//////// Move to previous Block
bool lastBlock(int walks=1){
  digitalWrite(dir, HIGH);
  digitalWrite(enable, LOW);
  int toWalk = stepsPerBlock * walks;
  for(int i=0; i < toWalk; i++){
    if(footer){
      footer=false;
      return false;
    }
    digitalWrite(stepPin, HIGH);
    delayForCompletion(i, toWalk);
    digitalWrite(stepPin, LOW);
    delayForCompletion(i, toWalk);
  }
  return true;
}

//////// Handles Interrupt on EndCourse
void foundFooter(){
  digitalWrite(enable, HIGH);
  footer=true;
}

void setup() {
  // Set pins
  pinMode(enable, OUTPUT);
  pinMode(dir, OUTPUT);
  pinMode(stepPin, OUTPUT);
  // Switch needs a PullUp
  pinMode(endSwitch, INPUT_PULLUP);
  
  // EndCourse Button Triggers STOP motors
  attachInterrupt(digitalPinToInterrupt(endSwitch),foundFooter, FALLING); 
  
  //Serial
  Serial.begin(115200);
  Serial.println("init");
  #ifdef DEBUG
    Serial.println("|--------- Turin Bot ---------|");
    Serial.println("|--------  Booted Up  --------|");
    Serial.print("Steps to mm: ");      
    Serial.println(stepToMm);     
    Serial.print("Desired Lenght: ");      
    Serial.println(EEPROM.read(0)/25.0);
    Serial.print("Steps per Block: ");      
    Serial.println(stepsPerBlock);
#endif
}

void loop() {
  // With Enable HIGH the motor is disabled
  digitalWrite(enable, HIGH);
  //Is there something on Serial?
  if(!Serial.available())
    return;   

  char cmd = Serial.read();
  //Reading Serial Commands
  if(cmd ==  'n'){                  //n means next block
    if(nextBlock()){
      blocks++;
      writeOK(cmd);
    }
      
    else
      writeNOK(cmd);            
  }
  if(cmd ==  'b'){                  //b means previous block
    if(blocks > 0){
      endBlock = false;
      if(lastBlock()){
        writeOK(cmd);
        blocks--;
      }
    }
    else
      writeNOK(cmd);
  }
  if(cmd ==  'l'){                  //l means less 0.05mm on desired length
    desiredLengthMm -= 0.05;
    EEPROM.write(0, desiredLengthMm*25.0);
    stepsPerBlock = desiredLengthMm/stepToMm;
    Serial.println(desiredLengthMm);
    writeOK(cmd);
  }
  if(cmd ==  'm'){                  //m means more 0.05mm on desired length
    desiredLengthMm += 0.05;
    EEPROM.write(0, desiredLengthMm*25.0);
    stepsPerBlock = desiredLengthMm/stepToMm;
    Serial.println(desiredLengthMm);
    writeOK(cmd);
  }
  if(cmd ==  'i'){                  //i asks for info
    Serial.print("Steps to mm: ");      
    Serial.println(stepToMm);     
    Serial.print("Desired Lenght: ");      
    Serial.println(EEPROM.read(0)/25.0);
    Serial.print("Steps per Block: ");      
    Serial.println(stepsPerBlock);
    Serial.print("Blocks: ");      
    Serial.println(blocks);
    Serial.print("End Index: ");      
    Serial.println(endIndex);
    writeOK(cmd);
  }
  if(cmd ==  'r'){                  //r resets all variables
    blocks=0;
    endIndex=0;
    footer=false;
    writeOK(cmd);
  }
  if(cmd ==  'f'){                  //f shows if it's in the last pice
    if(endBlock || (endIndex == blocks && (blocks != 0)))
      writeYes(cmd);
    else
      writeNo(cmd);
  }
} 