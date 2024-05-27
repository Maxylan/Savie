// Quick little browser plugin to make saving money a bit more exciting
// By @Maxylan
//
import Transform from './actions/transform';
import Test from './actions/test';
import { debounce } from './popup/utils/functions';
import {
    Savie,
    DocumentExtended,
    ActionResult,
    ActionResultCallback,
    Status,
    Page,
} from './types';

// Declare `d` (`DocumentExtended`) and define savie's members.
declare global {
    var d: DocumentExtended;
}
export var d = document as DocumentExtended;
if (!d || !d.savie) {
    d.savie = {
        init: false,
        valueChangeCallbacks: [],
        onValueChange: (...callbacks: ActionResultCallback[]) => {
            if (!d.savie.valueChangeCallbacks) {
                d.savie.valueChangeCallbacks ??= [];
            }
            
            const ar: ActionResult = {
                status: Status.Running,
                message: 'onValuesChange',
            };

            // "Push"/concat `...callbacks` onto `valueChangeCallbacks`, 
            // mapped as/converted to `ActionResult` object instances.
            d.savie.valueChangeCallbacks = 
                d.savie.valueChangeCallbacks.concat(
                    callbacks.map(_ => ({...ar, callback: _})));
        },
        // Executes/Runs all `valueChangeCallbacks` with `id` & `value` as data.
        valueChange: debounce(
            (id: string, value: string|number) => 
                d.savie.valueChangeCallbacks!.forEach(_ => 
                    run({..._, data: { id: id, value: value }}))),
        // Captures the `keyDownEvent` and passes that to `action(...)`, then
        // executes/runs the resulting `ActionResult`.
        keyDownEvent: async (e: any) => {
            if (!e.altKey || 
                e.keyCode === 18 || 
                e.isComposing || 
                e.keyCode === 229
            ) {
                return;
            }

            await run(action(e.keyCode));
            
            // For logging..
            // let result: ActionResult = await run(action(e.keyCode));
            // console.debug('Savie: result -', result);
        }
    };
}

// Ensure compatibility during testing..
export var compat: any = {}
if (typeof browser === 'undefined') {
    var fallback: any = { storage: { local: {
        get: async (..._key: any[]): Promise<any> => {
            if (!_key || !_key[0]) { 
                return compat;
            }

            let store: any = {};
            [..._key].forEach((_: any) => {
                store[_] = compat[_]
            });
            
            return Promise.resolve(store);
        },
        set: async (_kvp: any): Promise<any> => compat = {...compat, ..._kvp} 
        /* Object.keys(_kvp).forEach(_k => compat[_k] = _kvp[_k]); */
    }}}

    // Ensure `browser` is defined without overwriting the real one
    if (typeof browser === 'undefined') {
        (window as any).browser = fallback;
    }
}

// Save border details..
let Border: { 
    original?: string,
    current?: string,
    timeout?: any
} = {};

/**
 * Helper to set the border, and restore it 
 * after `timeout` microseconds.
 *
 * A spin on Mozilla's "Getting Started" guide for extensions!
 */
export const setBorder = (style: string, timeout: number = 3000) => {
    if (!style) { return; }

    // Clear current Border timeout & border (if unchanged), if any..
    if (Border.timeout) {
        clearTimeout(Border.timeout);
    }
    if (Border.current && d.body.style.border === Border.current) {
        d.body.style.border = Border.original!;
    }

    // Save border details..
    Border = {
        // In the unlikely event a border exists, save it.
        original: d.body.style.border
    }

    d.body.style.border = style;
    Border.current = style;

    // Restore the old body after `timeout` microseconds.
    Border.timeout = setTimeout(
        () => {
            d.body.style.border = Border.original!;
            Border = {};
        }, timeout
    );
}

/**
 * Fires when an action or key can't be found.
 */
export const missing = (status: string, keyCode?: number) => {
    setBorder("3px solid yellow", 200);
    console.debug('%c' + (status || 'Action/keyCode not found.') + ': ', 'color: lightgrey; font-size: 10px;', status, keyCode);
}

/**
 * Handles visualizing "partial" success:es
 */
export const partialSuccess = (status?: string, result?: ActionResult) => {
    setBorder("4px solid burlywood", 900);
    let partialSuccessStyle = 'color: burlywood; font-size: 10px;';
    console.debug('%cSavie: ' + (status || 'Partial Success!'), partialSuccessStyle, result);
    
    if (result?.callback || result?.callbackCount) {
        console.debug('%cCallback: ' + result.callbackCount, partialSuccessStyle, result.callback);
    }
    if (result?.data) {
        console.debug('%cData: ', partialSuccessStyle, result.data);
    }
}

/**
 * Handles visualizing a completely successfull run!
 */
export const success = (status?: string, result?: ActionResult) => {
    setBorder("4px solid lightgreen", 900);
    let successStyle = 'color: lightgreen; font-size: 10px;';
    console.debug('%cSavie: ' + (status || 'Success!'), successStyle);
    
    if (result?.callback || result?.callbackCount) {
        console.debug('%cCallback: ' + result.callbackCount, successStyle, result.callback);
    }
    if (result?.data) {
        console.debug('%cData: ', successStyle, result.data);
    }
}

/**
 * Handles visualizing & logging errors.
 */
export const fail = (ex: any, result?: ActionResult) => {
    setBorder("5px solid red"); // 3s, default timeout.
    console.error('Savie Error: ', ex, result);
    
    if (result?.callback || result?.callbackCount) {
        console.error('On Callback #' + result.callbackCount, result.callback);
    }
}

/**
 * Map keys to actions.
 */
export const action = (keyCode: number): ActionResult => {
    let ar: ActionResult = {
        status: Status.Running,
        message: 'keyCode: ' + keyCode
    };

    switch(keyCode) {
        /* "o" */ case 79: ar.callback = Transform;
        /* "p" */ case 80: ar.callback = Test;
        default: return {
            status: Status.Missing,
            message: 'Nothing mapped to keyCode: ' + keyCode
        }
    }

    return ar;
}

/**
 * Run a given action.
 */
export const run = async (action: ActionResult): Promise<ActionResult> => {
    if (!action || !action.callback) {
        return {
            status: Status.Failure,
            message: 'ActionResult or callback missing, nothing to run.',
            data: action
        };
    }

    try {
        let result: ActionResult = await action.callback(action);
        
        if (result.callback) {
            result.callbackCount = 1;
        }

        // Continue executing returned callbacks, if any..
        while (result.callback) {
            (result.callbackCount!)++;
            result = await result.callback(result);

            if (result.callbackCount! > 16) { 
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
                success(result.message, result);
                break;
            case Status.PartialSuccess:
                partialSuccess(result.message, result);
                break;
            case Status.Running: // Terminated.
                result.status = Status.PartialSuccess;
                partialSuccess(result.message, result);
                break;
            case Status.Failure:
                fail(result, result);
                break;
            default: // Status.Missing
                missing(result.message);
                break;
        }

        return result;
    }
    catch(ex: any) {
        return {
            status: Status.Failure,
            message: ex.message || JSON.stringify(ex),
            data: ex
        }
    }
}

// Init!
if (!d.savie.init) {
    d.savie.init = true;

    // Add callbacks that should fire when settings change..
    d.savie.onValueChange(
        Transform
    );

    // Add callback/listener capturing the global `onKeyDown` event.
    d.body.addEventListener(
        'keydown', d.savie.keyDownEvent
    );
}
