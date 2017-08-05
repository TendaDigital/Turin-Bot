#include "pid.h"

PID::PID(float _kp, float _ki, float _kd, float _iLimit = DEFAULT_PID_INTEGRATION_LIMIT){
    this->kp = _kp;
    this->ki = _ki;
    this->kd = _kd;
    this->iLimit = _iLimit;

    this->integ = 0;
    this->prevError = 0;
}

void PID::setTarget(float target){
    this->desired = target;
}

float PID::update(float input, float dt){
    float error = this->desired - input;
    
    this->integ = this->integ + error * dt * this->ki;

    if (this->integ > this->iLimit){
        this->integ = this->iLimit;
    }else if (this->integ < -this->iLimit){
        this->integ = -this->iLimit;
    }

    float deriv = (error - this->prevError) / dt;

    float output = this->kp * error + this->kd * deriv + this->integ;

    this->prevError = error;

    return output;
}

void PID::reset(){
    prevError = integ = 0;
}