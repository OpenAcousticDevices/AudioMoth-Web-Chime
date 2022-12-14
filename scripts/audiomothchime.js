/****************************************************************************
 * audiomothchime.js
 * openacousticdevices.info
 * August 2020
 *****************************************************************************/

'use strict';

/*global window */
/*jslint bitwise: true */

/* Main code entry point */

var AudioMothChime = function () {

    var obj, audioContext, frequencyLookup, HAMMING_CODES, NOTE_REGEX, BIT_RISE, BIT_FALL, LOW_BIT_SUSTAIN, HIGH_BIT_SUSTAIN, START_STOP_BIT_SUSTAIN, CARRIER_FREQUENCY, SPEED_FACTOR, USE_HAMMING_CODE, NUMBER_OF_STOP_BITS, NUMBER_OF_START_BITS, NOTE_RISE_DURATION, NOTE_FALL_DURATION, NOTE_LONG_FALL_DURATION, MIN_TONE_DURATION, MAX_TONE_DURATION;

    /* General constants */

    SPEED_FACTOR = 1;

    USE_HAMMING_CODE = true;

    CARRIER_FREQUENCY = 18000;

    NUMBER_OF_STOP_BITS = 8;

    NUMBER_OF_START_BITS = 16;

    /* Tone timing constants */

    BIT_RISE = 0.0005 / SPEED_FACTOR;
    BIT_FALL = 0.0005 / SPEED_FACTOR;

    LOW_BIT_SUSTAIN = 0.004 / SPEED_FACTOR;
    HIGH_BIT_SUSTAIN = 0.009 / SPEED_FACTOR;
    START_STOP_BIT_SUSTAIN = 0.0065 / SPEED_FACTOR;

    NOTE_RISE_DURATION = 0.030 / SPEED_FACTOR;
    NOTE_FALL_DURATION = 0.030 / SPEED_FACTOR;
    NOTE_LONG_FALL_DURATION = 0.090 / SPEED_FACTOR;

    MIN_TONE_DURATION = 500;
    MAX_TONE_DURATION = 60000;

    /* Note parsing constant */

    NOTE_REGEX = /^(C|C#|Db|D|D#|Eb|E|F|F#|Gb|G|G#|Ab|A|A#|Bb|B)([0-9]):([1-9])$/;

    /* Encoding constant */

    HAMMING_CODES = [
        [0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 0, 0, 0, 0],
        [1, 0, 0, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 1, 0, 1, 0],
        [1, 0, 1, 1, 0, 1, 0],
        [1, 1, 0, 0, 1, 1, 0],
        [0, 0, 1, 0, 1, 1, 0],
        [1, 1, 0, 1, 0, 0, 1],
        [0, 0, 1, 1, 0, 0, 1],
        [0, 1, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 1, 1],
        [0, 1, 1, 0, 0, 1, 1],
        [0, 0, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1]
    ];

    /* Functions to calculate CRC code */

    function crc_update(crc_in, incr) {

        var xor, out, CRC_POLY = 0x1021;

        xor = (crc_in >> 15) & 65535;
        out = (crc_in << 1) & 65535;

        if (incr > 0) {
            out += 1;
        }

        if (xor > 0) {
            out ^= CRC_POLY;
        }

        return out;

    }

    function crc16(bytes) {

        var i, j, low, high, crc = 0;

        for (i = 0; i < bytes.length; i += 1) {
            for (j = 7; j >= 0; j -= 1) {
                crc = crc_update(crc, bytes[i] & (1 << j));
            }
        }

        for (i = 0; i < 16; i += 1) {
            crc = crc_update(crc, 0);
        }

        low = crc & 255;
        high = (crc >> 8) & 255;

        return [low, high];

    }

    /* Function to encode bytes */

    function encode(bytes) {

        var i, j, low, high, mask, bitSequence = [];

        for (i = 0; i < bytes.length; i += 1) {

            if (USE_HAMMING_CODE) {

                low = bytes[i] & 0x0F;

                high = (bytes[i] & 0xFF) >> 4;

                for (j = 0; j < 7; j += 1) {

                    bitSequence.push(HAMMING_CODES[low][j]);

                    bitSequence.push(HAMMING_CODES[high][j]);

                }

            } else {

                for (j = 0; j < 8; j += 1) {

                    mask = 0x01 << j;

                    bitSequence.push((mask & bytes[i]) === mask ? 1 : 0);

                }

            }

        }

        return bitSequence;

    }

    /* Functions to parse and generate notes */

    function generateFrequencyLookup() {

        var i, j, note, NOTE_PREFIXES, NOTE_DISTANCES, NUMBER_OF_OCTAVES, lookUpTable = {};

        NUMBER_OF_OCTAVES = 10;

        NOTE_PREFIXES = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

        NOTE_DISTANCES = [-9, -8, -8, -7, -6, -6, -5, -4, -3, -3, -2, -1, -1, 0, 1, 1, 2];

        for (i = 0; i < NUMBER_OF_OCTAVES; i += 1) {
            for (j = 0; j < NOTE_PREFIXES.length; j += 1) {
                note = NOTE_PREFIXES[j] + i;
                lookUpTable[note] = Math.round(440 * Math.pow(2, i - 4 + NOTE_DISTANCES[j] / 12));
            }
        }

        return lookUpTable;

    }

    function parseFrequencies(notes) {

        var i, result, frequencies = [];

        if (notes) {

            for (i = 0; i < notes.length; i += 1) {
                result = notes[i].match(NOTE_REGEX);
                if (result) {
                    frequencies.push(frequencyLookup[result[1] + result[2]]);
                }
            }

        }

        if (frequencies.length === 0) {
            return [523];
        }

        return frequencies;

    }

    function parseDurations(notes) {

        var i, result, durations = [];

        if (notes) {

            for (i = 0; i < notes.length; i += 1) {
                result = notes[i].match(NOTE_REGEX);
                if (result) {
                    durations.push(parseInt(result[3], 10));
                }
            }

        }

        if (durations.length > 0) {
            return durations;
        }

        return [1];

    }

    /* Functions to generate waveforms */

    function createWaveformComponent(waveform, state, frequency, phase, rampUp, sustain, rampDown) {

        var k, x, y, theta, volume, samplesInRampUp, samplesInSustain, samplesInRampDown;

        samplesInRampUp = rampUp * audioContext.sampleRate;

        samplesInSustain = sustain * audioContext.sampleRate;

        samplesInRampDown = rampDown * audioContext.sampleRate;

        theta = 2 * Math.PI * frequency / audioContext.sampleRate;

        for (k = 0; k < samplesInRampUp + samplesInSustain + samplesInRampDown; k += 1) {

            if (k < samplesInRampUp) {

                state.amplitudePhase = Math.min(Math.PI / 2, state.amplitudePhase + Math.PI / 2 / samplesInRampUp);

            }

            if (k >= samplesInRampUp + samplesInSustain) {

                state.amplitudePhase = Math.max(0, state.amplitudePhase - Math.PI / 2 / samplesInRampDown);

            }

            volume = Math.pow(Math.sin(state.amplitudePhase), 2);

            waveform.push(volume * phase * state.x);

            x = state.x * Math.cos(theta) - state.y * Math.sin(theta);
            y = state.x * Math.sin(theta) + state.y * Math.cos(theta);

            state.x = x;
            state.y = y;

        }

    }

    function createWaveform(duration, bytes, notes) {

        var i, phase, state, bitSequence, bitDuration, noteDuration, noteDurations, tonePairs, sumOfNoteDurations, noteFallDuration, frequencies, waveform, waveform1, waveform2;

        waveform = [];

        waveform1 = [];

        waveform2 = [];

        /* Generate note sequence */

        noteDurations = parseDurations(notes);

        frequencies = parseFrequencies(notes);

        /* Counters used during sound wave creation */

        state = {
            amplitudePhase: 0,
            x: 1,
            y: 0
        };

        phase = 1;

        /* Generate data or start tone */

        if (bytes) {

            /* Initial start bits */

            for (i = 0; i < NUMBER_OF_START_BITS; i += 1) {

                createWaveformComponent(waveform1, state, CARRIER_FREQUENCY, phase, BIT_RISE, START_STOP_BIT_SUSTAIN, BIT_FALL);

                phase *= -1;

            }

            /* Generate bit sequence */

            bytes = bytes.concat(crc16(bytes));

            bitSequence = encode(bytes);

            /* Display output */

            console.log("AUDIOMOTH CHIME: " + bytes.length + " bytes");

            console.log("AUDIOMOTH CHIME: " + bitSequence.length + " bits");

            /* Data bits */

            for (i = 0; i < bitSequence.length; i += 1) {

                bitDuration = bitSequence[i] === 1 ? HIGH_BIT_SUSTAIN : LOW_BIT_SUSTAIN;

                createWaveformComponent(waveform1, state, CARRIER_FREQUENCY, phase, BIT_RISE, bitDuration, BIT_FALL);

                phase *= -1;

            }

            /* Stop bits */

            for (i = 0; i < NUMBER_OF_STOP_BITS; i += 1) {

                createWaveformComponent(waveform1, state, CARRIER_FREQUENCY, phase, BIT_RISE, START_STOP_BIT_SUSTAIN, BIT_FALL);

                phase *= -1;

            }

        } else {

            tonePairs = Math.max(MIN_TONE_DURATION, Math.min(MAX_TONE_DURATION, duration)) / 1000 / (2 * BIT_RISE + HIGH_BIT_SUSTAIN + LOW_BIT_SUSTAIN + 2 * BIT_FALL);

            for (i = 0; i < tonePairs; i += 1) {

                createWaveformComponent(waveform1, state, CARRIER_FREQUENCY, phase, BIT_RISE, HIGH_BIT_SUSTAIN, BIT_FALL);

                phase *= -1;

                createWaveformComponent(waveform1, state, CARRIER_FREQUENCY, phase, BIT_RISE, LOW_BIT_SUSTAIN, BIT_FALL);

                phase *= -1;

            }

        }

        /* Counters used during sound wave creation */

        state = {
            amplitudePhase: 0,
            x: 1,
            y: 0
        };

        /* Calculate note duration */

        sumOfNoteDurations = 0;

        for (i = 0; i < noteDurations.length; i += 1) {
            sumOfNoteDurations += noteDurations[i];
        }

        noteDuration = waveform1.length / audioContext.sampleRate - noteDurations.length * (NOTE_RISE_DURATION + NOTE_FALL_DURATION) + NOTE_FALL_DURATION - NOTE_LONG_FALL_DURATION;

        noteDuration /= sumOfNoteDurations;

        /* Create note waveform */

        for (i = 0; i < noteDurations.length; i += 1) {

            noteFallDuration = i === noteDurations.length - 1 ? NOTE_LONG_FALL_DURATION : NOTE_FALL_DURATION;

            createWaveformComponent(waveform2, state, frequencies[i], 1, NOTE_RISE_DURATION, noteDuration * noteDurations[i], noteFallDuration);

        }

        /* Sum the waveforms */

        for (i = 0; i < Math.min(waveform1.length, waveform2.length); i += 1) {

            waveform.push(waveform1[i] / 4 + waveform2[i] / 2);

        }

        return waveform;

    }

    /* Function to generate sound */

    function play(sendTime, duration, bytes, notes, callback) {

        function onended() {

            console.log("AUDIOMOTH CHIME: Done");

            callback();

        }

        function perform() {

            var i, now, delay, source, buffer, channel, waveform;

            /* Initialize audio context */

            if (!audioContext) {
                if (window.AudioContext) {
                    audioContext = new window.AudioContext();
                } else {
                    audioContext = new window.webkitAudioContext();
                }
            }

            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }

            /* Generate the waveform */

            waveform = createWaveform(duration, bytes, notes);

            /* Generate the waveform */

            buffer = audioContext.createBuffer(1, waveform.length, audioContext.sampleRate);

            channel = buffer.getChannelData(0);

            for (i = 0; i < waveform.length; i += 1) {

                channel[i] = waveform[i];

            }

            source = audioContext.createBufferSource();

            source.buffer = buffer;

            source.onended = onended;

            source.connect(audioContext.destination);

            /* Play the waveform at the appropriate time */

            delay = 0;

            if (sendTime) {

                now = new Date();

                delay = sendTime.getTime() - now.getTime();

            }
            
            if (delay <= 0) {

                console.log("AUDIOMOTH CHIME: Start");
                
                source.start();
        
            } else {

                console.log("AUDIOMOTH CHIME: Waiting " + delay + " milliseconds");

                setTimeout(function() {

                    console.log("AUDIOMOTH CHIME: Start");

                    source.start()
                    
                }, delay);
        
            }

        }

        /* Play the sound */
        
        setTimeout(perform, 0);

    }

    /* Code entry point */

    frequencyLookup = generateFrequencyLookup();

    obj = {};

    obj.tone = function (duration, notes, callback) {

        play(null, duration, null, notes, callback);

    };

    obj.chime = function (sendTime, bytes, notes, callback) {

        play(sendTime, null, bytes, notes, callback);

    };

    return obj;

};