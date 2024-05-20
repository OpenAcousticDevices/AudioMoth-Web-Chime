/****************************************************************************
 * audiomothchime_connector.js
 * openacousticdevices.info
 * August 2020
 *****************************************************************************/

'use strict';

/*global AudioMothChime */
/*jslint bitwise: true */

var AudioMothChimeConnector = function () {

    const MINIMUM_DELAY = 200;

    const LENGTH_OF_DEPLOYMENT_ID = 8;

    const MILLISECONDS_IN_SECOND = 1000;

    const LATITUDE_PRECISION = 1000000;
    
    const LONGITUDE_PRECISION = 500000;

    /* Function to encode little-endian value */

    function littleEndianBytes(byteCount, value) {

        const buffer = [];

        for (let i = 0; i < byteCount; i += 1) {

            buffer.push((value >> (i * 8)) & 0xFF);
        
        }

        return buffer;

    }

    /* Function to generate component data */

    function encodeTime(date) {

        const unixTime = Math.round(date.valueOf() / MILLISECONDS_IN_SECOND);

        const timezoneMinutes = -date.getTimezoneOffset();

        let bytes = littleEndianBytes(4, unixTime);

        bytes = bytes.concat(littleEndianBytes(2, timezoneMinutes));

        return bytes;

    }

    function encodeLocation(latitude, longitude) {

        const buffer = [];
    
        latitude = Math.round(Math.max(-90, Math.min(90, latitude)) * LATITUDE_PRECISION);
        longitude = Math.round(Math.max(-180, Math.min(180, longitude)) * LONGITUDE_PRECISION);

        buffer.push(latitude & 0xFF);
        buffer.push((latitude >> 8) & 0xFF);
        buffer.push((latitude >> 16) & 0xFF);

        buffer.push(((latitude >> 24) & 0x0F) | ((longitude & 0x0F) << 4));

        buffer.push((longitude >> 4) & 0xFF);
        buffer.push((longitude >> 12) & 0xFF);
        buffer.push((longitude >> 20) & 0xFF);

        return buffer;

    }

    function encodeDeploymentID(deploymentID) {

        const buffer = [];

        for (let i = 0; i < LENGTH_OF_DEPLOYMENT_ID; i += 1) {

            buffer.push(deploymentID[deploymentID.length - 1 - i] & 0xFF);

        }

        return buffer;

    }

    /* Main code entry point */

    const obj = { };

    const audioMothChime = new AudioMothChime();

    obj.playTone = function (duration, callback) {

        audioMothChime.tone(duration, ["C5:1"], callback);

    };

    obj.playTime = function (date, latitude, longitude, callback) {

        const sendTime = new Date(date);

        let delay = MILLISECONDS_IN_SECOND - sendTime.getMilliseconds();

        if (delay < MINIMUM_DELAY) delay += MILLISECONDS_IN_SECOND;

        sendTime.setMilliseconds(sendTime.getMilliseconds() + delay);

        let bytes = encodeTime(sendTime);

        const locationValid = latitude !== undefined && latitude !== null && typeof latitude === 'number' && longitude !== undefined && longitude !== null && typeof longitude === 'number';

        if (locationValid) bytes = bytes.concat(encodeLocation(latitude, longitude));

        let tune = ["C5:1", "D5:1", "E5:1", "C5:3"];
        
        if (locationValid) tune = tune.concat(["D5:1", "E5:1", "C5:3"]);

        audioMothChime.chime(sendTime, bytes, tune, callback);

    };

    obj.playTimeAndDeploymentID = function (date, latitude, longitude, deploymentID, callback) {

        const sendTime = new Date(date);

        let delay = MILLISECONDS_IN_SECOND - sendTime.getMilliseconds();

        if (delay < MINIMUM_DELAY) delay += MILLISECONDS_IN_SECOND;

        sendTime.setMilliseconds(sendTime.getMilliseconds() + delay);
       
        let bytes = encodeTime(sendTime);

        const locationValid = latitude !== undefined && latitude !== null && typeof latitude === 'number' && longitude !== undefined && longitude !== null && typeof longitude === 'number';

        if (locationValid) bytes = bytes.concat(encodeLocation(latitude, longitude));

        if (deploymentID && deploymentID.length === LENGTH_OF_DEPLOYMENT_ID) {

            bytes = bytes.concat(encodeDeploymentID(deploymentID));

            let tune = ["Eb5:1", "G5:1", "D5:1", "F#5:1", "Db5:1", "F5:1", "C5:1", "E5:5"];

            if (locationValid) tune = tune.concat(["Db5:1", "F5:1", "C5:1", "E5:4"]);

            audioMothChime.chime(sendTime, bytes, tune, callback);

        } else {

            console.log("AUDIOMOTH CHIME_CONNECTOR: Deployment ID is null or an incorrect length");

            callback();
    
        }

    };

    return obj;

};
