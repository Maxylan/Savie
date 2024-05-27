// Quick little browser plugin to make saving money a bit more exciting
// By @Maxylan
//
import Transform from './actions/transform';
import Test from './actions/test';

export enum Page {
    Settings,
    Incomes
};

export enum Status {
    Success,
    PartialSuccess,
    Failure,
    Missing
};

export type ActionResult = {
    status: Status,
    message: string,
    data?: any,
    callback?: (prev: ActionResult) => Promise<ActionResult>,
    callbackCount?: number
};

/**
 * Map keys to actions.
 */
const action = async (keyCode: number): Promise<ActionResult> => {
    try {
        switch(keyCode) {
            /* "o" */ case 79: return Transform();
            /* "o" */ case 80: return Test();
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
 * Fires when an action corresponding to the given key can't be found.
 */
export const missing = (keyCode: number, status?: string) => {
    console.debug('%c' + (status || 'keyCode') + ': ', 'color: lightgrey; font-size: 8px;', keyCode);
    setBorder("3px solid yellow", 150);
}

/**
 * Handles visualizing "partial" success:es
 */
export const partialSuccess = (status?: string, result?: ActionResult) => {
    setBorder("4px solid burlywood", 900);
    let partialSuccessStyle = 'color: burlywood; font-size: 12px;';
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
    let successStyle = 'color: lightgreen; font-size: 12px;';
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

// Declare `d` (`DocumentExtended`) and define savie's members.
var d = document as DocumentExtended;
d.savie = {
    init: false,
    onValuesChangeCallbacks: [ Transform ],
    onValuesChange: (callback: ((id: string, value: string|number) => void)) => {
        if (!d.savie.onValuesChangeCallbacks) {
            d.savie.onValuesChangeCallbacks ??= [];
        }
        
        d.savie.onValuesChangeCallbacks.push(callback);
    },
    valuesChange: (id: string, value: string|number) => 
        d.savie.onValuesChangeCallbacks!.forEach((_) => _(id, value)),
    keyDownEvent: async (e: any) => {
        if (!e.altKey || 
            e.keyCode === 18 || 
            e.isComposing || 
            e.keyCode === 229
        ) {
            return;
        }

        let result: ActionResult = await action(e.keyCode);
        
        if (result.callback) {
            result.callbackCount = 0;
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
            case Status.Failure:
                fail(result, result);
                break;
            default: // Status.Missing
                missing(e.keyCode, result.message);
                break;
        }
    }
};

// Init..
if (!d.savie.init) 
{
    d.savie.init = true;
    d.body.addEventListener(
        'keydown', d.savie.keyDownEvent
    );
}
