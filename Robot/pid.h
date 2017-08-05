#ifndef PID_H
#define PID_H

#define DEFAULT_PID_INTEGRATION_LIMIT  5000.0

class PID{

public:
	float desired;     //< set point
	// float error;        //< error
	float prevError;    //< previous error
	float integ;        //< integral
	// float deriv;        //< derivative
	float kp;           //< proportional gain
	float ki;           //< integral gain
	float kd;           //< derivative gain
	// float outP;         //< proportional output (debugging)
	// float outI;         //< integral output (debugging)
	// float outD;         //< derivative output (debugging)
	float iLimit;       //< integral limit
	// float iLimitLow;    //< integral limit
	// float dt;           //< delta-time dt
	// float output;

	PID(float kp, float ki, float kd, float _ilimit);

	void setTarget(float target);
	float update(float input, float dt);
	void reset();

};

#endif