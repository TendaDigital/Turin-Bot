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

int blocks = 1;

//////// Accepts Serial Commannds
void writeOK(char cmd){
  Serial.print(":");
  Serial.write(cmd);
  Serial.println(":OK");
}

//////// ERROR on Serial
void writeNOK(char cmd){
  Serial.print(":");
  Serial.write(cmd);
  Serial.println(":ERROR");
}

#define SPEED 100
int ACCEL_STEPS = 40;
int ACCEL_DELAY = 500;

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

//////// 
bool nextBlock(int blocks=1){

  digitalWrite(dir, LOW);
  digitalWrite(enable, LOW);
  int toWalk = stepsPerBlock * blocks;
  
  for(int i=0; i < toWalk; i++){
    if(footer){
      return false;
    }
    digitalWrite(stepPin, HIGH);
    delayForCompletion(i, toWalk);
    digitalWrite(stepPin, LOW);
    delayForCompletion(i, toWalk);
  }
  return true;
}

bool lastBlock(int blocks=1){

  digitalWrite(dir, HIGH);
  digitalWrite(enable, LOW);

  int toWalk = stepsPerBlock * blocks;
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
  Serial.println("|--------- Turin Bot ---------|");
  Serial.println("|--------  Booted Up  --------|");
  #ifdef DEBUG
    Serial.print("Steps to mm: ");      
    Serial.println(stepToMm);     
    Serial.print("Desired Lenght: ");      
    Serial.println(EEPROM.read(0)/25.0);
    Serial.print("Steps per Block: ");      
    Serial.println(stepsPerBlock);
#endif
  

}

void loop() {
  
  // With Enable LOW the FETs are activate
 digitalWrite(enable, HIGH);

  if(!Serial.available())
    return;
    
  char cmd = Serial.read();

  if(cmd ==  'n'){
    if(nextBlock()){
      blocks++;
      writeOK(cmd);
    }
      
    else
      writeNOK(cmd);            
  }
  if(cmd ==  'b'){
    if(lastBlock()){
      writeOK(cmd);
      blocks--;
    }
    else
      writeNOK(cmd);
   }
  if(cmd ==  'l'){
    desiredLengthMm -= 0.05;
    EEPROM.write(0, desiredLengthMm*25.0);
    stepsPerBlock = desiredLengthMm/stepToMm;
    Serial.println(desiredLengthMm);
    writeOK(cmd);
  }
  if(cmd ==  'm'){
    desiredLengthMm += 0.05;
    EEPROM.write(0, desiredLengthMm*25.0);
    stepsPerBlock = desiredLengthMm/stepToMm;
    Serial.println(desiredLengthMm);
    writeOK(cmd);
  }
  if(cmd ==  's'){
    Serial.print("Steps to mm: ");      
    Serial.println(stepToMm);     
    Serial.print("Desired Lenght: ");      
    Serial.println(EEPROM.read(0)/25.0);
    Serial.print("Steps per Block: ");      
    Serial.println(stepsPerBlock);
    Serial.print("Blocks: ");      
    Serial.println(blocks);
    writeOK(cmd);
  }
  if(cmd ==  'r'){
    blocks=1;
    footer=false;
    writeOK(cmd);
  }
} 