// Quick little browser plugin to make saving money a bit more exciting
// By @Maxylan
//
declare global {
    type Savie = {
        keyDownEvent?: any
    }

    type DocumentExtended = Document & {
        savie: Savie;
    }
}

var d = document as DocumentExtended;
d.savie = {};

import icon from './icons/savie-48.ico';
import homieIcon from './icons/Homie.ico';
import homieIconAsPNG from './icons/Homie.png';
if (icon && homieIcon && homieIconAsPNG) {
    console.debug('%cSavie Assets Loaded', 'color: grey; font-size: 8px;');
}

import Transform from './actions/transform';

export enum Status {
    Success,
    PartialSuccess,
    Failure,
    Missing
}
export type ActionResult = {
    status: Status,
    message: string,
    data?: any,
    callback?: (prev: ActionResult) => ActionResult
};

/**
 * Map keys to actions.
 */
const action = (keyCode: number): ActionResult => {
    try {
        switch(keyCode) {
            /* "o" */ case 79: return Transform();
            default: return {
                status: Status.Missing,
                message: 'Nothing mapped to keyCode: ' + keyCode
            }
        }
    }
    catch(ex: any) {
        return {
            status: Status.Failure,
            message: ex.message || JSON.stringify(ex),
            data: ex
        }
    }
}

/**
 * Helper to set the boreder, and restore it 
 * after `timeout` microseconds.
 */
export const setBorder = (style: string, timeout: number = 3000) => {
    // Override the current `document.body` border. 
    // In the inlikely event a border exists, save it.
    let _border = document.body.style.border;
    document.body.style.border = style;

    // Restore the old body after `timeout` microseconds.
    setTimeout(
        () => document.body.style.border = _border,
        timeout
    ); 
}

/**
 * Fires when an action corresponding to the given key can't be found.
 */
export const missing = (keyCode: number, status?: string) => {
    console.debug('%c' + (status || 'keyCode') + ': ', 'color: grey; font-size: 8px;', keyCode);
    setBorder("3px solid yellow", 150);
}

/**
 * Handles visualizing "partial" success:es
 */
export const partialSuccess = (status?: string, callback?: number) => {
    setBorder("4px solid burlywood", 900);
    
    if (callback) {
        console.log('%cSavie: ' + (status || 'Partial Success!'), 'color: brown; font-size: 12px;', 'Callback: ' + callback);
    }
    else {
        console.log('%cSavie: ' + (status || 'Partial Success!'), 'color: brown; font-size: 12px;');
    }
}

/**
 * Handles visualizing a completely successfull run!
 */
export const success = (status?: string, callback?: number) => {
    setBorder("4px solid lightgreen", 900);

    if (callback) {
        console.log('%cSavie: ' + (status || 'Success!'), 'color: green; font-size: 12px;', 'Callback: ' + callback);
    }
    else {
        console.log('%cSavie: ' + (status || 'Success!'), 'color: green; font-size: 12px;');
    }
}

/**
 * Handles visualizing & logging errors.
 */
export const fail = (ex: any, callback?: number) => {
    setBorder("5px solid red"); // 3s, default timeout.

    if (callback) {
        console.error('Savie Error on callback #'+callback+': ', ex);
    }
    else {
        console.error('Savie Error: ', ex);
    }
}

// Todo, improve this
const init = (e: any) => {
    if (!e.altKey || 
        e.keyCode === 18 || 
        e.isComposing || 
        e.keyCode === 229
    ) {
        return;
    }

    let result: ActionResult = action(e.keyCode);
    let callbackCounter: number = 0;

    // Continue executing returned callbacks, if any..
    while (result.callback) {
        callbackCounter++;
        result = result.callback(result);

        if (callbackCounter > 16) { 
            if (!result.data) {
                result.data = {}
            }
            result.data.interrupted = true;
            result.message = 'Interrupted - ' + result.message;
            break;
        }
    }

    switch(result.status) {
        case Status.Success:
            success(result.message, callbackCounter || undefined);
            break;
        case Status.PartialSuccess:
            partialSuccess(result.message, callbackCounter);
            break;
        case Status.Failure:
            fail(result, callbackCounter);
            break;
        default: // Status.Missing
            missing(e.keyCode, result.message);
            break;
    }
}

// Init..
if (!d.savie.keyDownEvent) {
    d.savie.keyDownEvent = init;
    document.body.addEventListener(
        'keydown', d.savie.keyDownEvent
    );

    console.debug('%cSavie Loaded', 'color: grey; font-size: 8px;');
}
