const express = require('express');
const router = express.Router();
const { STATE } = require('../constants');
const iottrain = require('../iottrain_central');

router.get('/', async(req, res, next) => {
    try {
        if ( req.app.get('state') === STATE.READY ||
            req.app.get('state') === STATE.GOAL) {
            
            res.status(403).json(
                {
                    status: 'Forbidden',
                    message: 'Request not currently allowed',
                }
            );
            return;
        }   
 
        await Promise.all([
            getAccelerometer(),
            getGyroscope(),
            getVoltage(),
        ]);

        const accel = iottrain.inbox.accelerometer;
        const gyro = iottrain.inbox.gyroscope;
        const temp = iottrain.inbox.temperature;
        const volt = iottrain.inbox.voltage;
        
        console.log("accel@" + accel.timestamp + ": " + accel.x + ", " + accel.y + ", " + accel.z);
        console.log(" gyro@" + gyro.timestamp + ": " + gyro.x + ", " + gyro.y + ", " + gyro.z);
        console.log(" temp@" + temp.timestamp + ": " + temp.value + "℃");
        console.log(" volt@" + volt.timestamp + ": " + volt.value + "V");

        const param = {
            'accel': {
                'x': accel.x, 
                'y': accel.y, 
                'z': accel.z, 
            },
            'gyro': {
                'x': gyro.x, 
                'y': gyro.y, 
                'z': gyro.z, 
            },
            'volt': volt.value, 
        };
        res.header('Content-Type', 'application/json; charset=utf-8')
        res.send(param);
        return
    } catch (error) {
        console.log(error);
        res.header('Content-Type', 'application/json; charset=utf-8')
        res.status(500).json(
            {
                status: 'Internal Server Error'
            }
        );
        return;
    }
});

router.put('/', (req, res, next) => {
    try {
        if (!req.app.get('allowOpReqToTrain')) {       
            res.status(403).json(
                {
                    status: 'Forbidden',
                    message: 'Request not currently allowed',
                }
            );
            return;
        }
        const pwm = Number(req.query.pwm)
        if (pwm === NaN || !(pwm >= 0 && pwm <= 100)) {
            res.header('Content-Type', 'application/json; charset=utf-8')
            res.status(400).json(
                {
                    status: 'Bad Request',
                    message: 'pwm not specified or out of range',
                }
            );
            return;
        }

        res.header('Content-Type', 'application/json; charset=utf-8')
        res.status(200).json(
            {
                status: 'OK',
            }
        );
        return;
    } catch (error) {
        console.log(error)
        res.header('Content-Type', 'application/json; charset=utf-8')
        res.status(500).json(
            {
                status: 'Internal Server Error',
            }
        );
        return; 
    }
});

const getAccelerometer = () => {
    return new Promise((resolve, reject) => {
        iottrain.characteristics["accelerometer"].instance.read((error, data) => {
            if (error !== null) {
                return reject(error)
            }    
            return resolve(data)
        })
    }).then(data => {
        iottrain.inbox["accelerometer"].x = data.readFloatLE(4);
        iottrain.inbox["accelerometer"].y = data.readFloatLE(8);
        iottrain.inbox["accelerometer"].z = data.readFloatLE(12);
        return;
    }).catch(error => {
        console.log(error);
        iottrain.inbox["accelerometer"].x = null;
        iottrain.inbox["accelerometer"].y = null;
        iottrain.inbox["accelerometer"].z = null;
        return;
    })
  }
  
const getGyroscope = () => {
    return new Promise((resolve, reject) => {
        iottrain.characteristics["gyroscope"].instance.read((error, data) => {
            if (error !== null) {
                return reject(error)
            }
            return resolve(data)
        });
    }).then(data => {
        iottrain.inbox["gyroscope"].x = data.readFloatLE(4);
        iottrain.inbox["gyroscope"].y = data.readFloatLE(8);
        iottrain.inbox["gyroscope"].z = data.readFloatLE(12);
        return;
    }).catch(error => {
        console.log(error);
        iottrain.inbox["gyroscope"].x = null;
        iottrain.inbox["gyroscope"].y = null;
        iottrain.inbox["gyroscope"].z = null;
        return;
    })
}
  
const getVoltage = () => {
    return new Promise((resolve, reject) => {
        iottrain.characteristics["voltage"].instance.read((error, data) => {
            if (error !== null) {
                return reject(error)
            }
            return resolve(data)
        });
    }).then(data =>{
        iottrain.inbox["voltage"].value = data.readFloatLE(4);
        return;
    }).catch(error => {
        console.log(error);
        iottrain.inbox["voltage"].value = null;
        return;
    })
}
  
module.exports = router;