/****************************************************************************
 * audiomothchime_connector.js
 * openacousticdevices.info
 * August 2020
 *****************************************************************************/

'use strict';

/*global AudioMothChime */
/*jslint bitwise: true */

var AudioMothChimeConnector = function () {

    var obj, audioMothChime, MINIMUM_DELAY, MILLISECONDS_IN_SECOND, LENGTH_OF_DEPLOYMENT_ID;

    MINIMUM_DELAY = 200;

    LENGTH_OF_DEPLOYMENT_ID = 8;

    MILLISECONDS_IN_SECOND = 1000;

    /* Function to encode little-endian value */

    function littleEndianBytes(byteCount, value) {

        var i, buffer = [];

        for (i = 0; i < byteCount; i += 1) {
            buffer.push((value >> (i * 8)) & 255);
        }

        return buffer;

    }

    /* Function to generate time data */

    function setTimeData(date) {

        var bytes, unixTime, timezoneMinutes;

        unixTime = Math.round(date.valueOf() / 1000);

        timezoneMinutes = -date.getTimezoneOffset();

        bytes = littleEndianBytes(4, unixTime);

        bytes = bytes.concat(littleEndianBytes(2, timezoneMinutes));

        return bytes;

    }

    /* Main code entry point */

    audioMothChime = new AudioMothChime();

    obj = { };

    obj.playTone = function (duration, callback) {

        audioMothChime.tone(duration, ["C5:1"], callback);

    };

    obj.playTime = function (date, callback) {

        var bytes, delay, sendTime = new Date(date);

        delay = MILLISECONDS_IN_SECOND - sendTime.getMilliseconds();

        if (delay < MINIMUM_DELAY) delay += MILLISECONDS_IN_SECOND;

        sendTime.setMilliseconds(sendTime.getMilliseconds() + delay);

        bytes = setTimeData(sendTime);

        audioMothChime.chime(sendTime, bytes, ["C5:1", "D5:1", "E5:1", "C5:3"], callback);

    };

    obj.playTimeAndDeploymentID = function (date, deploymentID, callback) {

        var i, bytes, delay, sendTime = new Date(date);

        delay = MILLISECONDS_IN_SECOND - sendTime.getMilliseconds();

        if (delay < MINIMUM_DELAY) delay += MILLISECONDS_IN_SECOND;

        sendTime.setMilliseconds(sendTime.getMilliseconds() + delay);
       
        bytes = setTimeData(sendTime);

        if (!deploymentID || deploymentID.length !== LENGTH_OF_DEPLOYMENT_ID) { return; }

        for (i = 0; i < LENGTH_OF_DEPLOYMENT_ID; i += 1) {

            bytes.push(deploymentID[deploymentID.length - 1 - i] & 0xFF);

        }

        audioMothChime.chime(sendTime, bytes, ["Eb5:1", "G5:1", "D5:1", "F#5:1", "Db5:1", "F5:1", "C5:1", "E5:5"], callback);

    };

    return obj;

};