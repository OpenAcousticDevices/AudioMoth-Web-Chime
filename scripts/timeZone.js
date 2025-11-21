/****************************************************************************
 * timeZone.js
 * openacousticdevices.info
 * October 2025
 *****************************************************************************/

import init, {
    WasmFinder
} from 'https://www.unpkg.com/tzf-wasm@v0.1.4/tzf_wasm.js';

let finder;

let calculatingTimeZone = false;

const HEADER_TIMEZONE_REGEX = /GMT([-|+]\d+)?:?(\d\d)?/;
const MINUTES_IN_HOUR = 60;

async function initialiseTzf () {

    console.log('Initialising time zone finder');

    calculatingTimeZone = true;

    await init();
    finder = new WasmFinder();

    calculatingTimeZone = false;

    console.log('Done');

}

function isCalculatingTimeZone () {

    return calculatingTimeZone;

}

async function getTimeZoneFromCoord (lat, lon) {

    if (!lat || !lon) {

        return 0;

    }

    calculatingTimeZone = true;

    const timeZone = await finder.get_tz_name(lon, lat);

    calculatingTimeZone = false;

    if (!timeZone) {

        console.error(`No time zone found for (${lat}, ${lon})`);
        return 0;

    }

    const date = new Date();
    const dateString = date.toLocaleString('en-GB', {timeZone: timeZone, hour12: false, timeZoneName: 'longOffset'});

    let offset = 0;

    const match = dateString.match(HEADER_TIMEZONE_REGEX);

    if (match) {

        if (match[1]) {

            const negative = match[1].includes('-');

            // Hours
            offset = parseInt(match[1], 10);

            if (match[2]) {

                let minutes = parseInt(match[2], 10);

                if (negative) minutes *= -1;

                offset += minutes / MINUTES_IN_HOUR;

            }

        }

    }

    return offset;

}

export {initialiseTzf, getTimeZoneFromCoord, isCalculatingTimeZone};
