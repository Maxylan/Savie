// Quick little browser plugin to make saving money a bit more exciting
// By @Maxylan
//
import Transform from './actions/transform.ts';
import ClearObserver from './actions/clearObserver.ts';
import {  
    s, tF, debounce,
    success,
    partialSuccess,
    missing,
    fail
} from './popup/utils/functions.ts';
import {
    Savie,
    DocumentExtended,
    ActionResult,
    ActionResultCallback,
    Status,
    Page,
} from './types.ts';

// Declare `d` (`DocumentExtended`) and define savie's members.
declare global {
    var d: DocumentExtended;
}
export var d = document as DocumentExtended;
if (!d || !d.savie) {
    d.savie = {
        init: false,
        debug: false,
        border: {},
        valueChangeCallbacks: [],
        observerConfig: {
            childList: true,
            subtree: true
        },
        observerLifespan: s(300),
        onValueChange: (...callbacks: ActionResultCallback[]) => {
            // ...
        },
        // Captures the `keyDownEvent` and passes that to `action(...)`, then
        // executes/runs the resulting `ActionResult`.
        keyDownEvent: async (e: any) => {
            if (e.keyCode === 18 || 
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

/**
 * Map keys to actions.
 */
export const action = (keyCode: number, ke?: KeyboardEvent): ActionResult => {
    let ar: ActionResult = {
        status: Status.Running,
        message: 'keyCode: ' + keyCode
    };

    switch(keyCode) {
        /* "§" */ case 192: 
            if (!ke) {
                ar.callback = (d.savie.observer 
                    ? Transform // Transform prices in the HTML DOM..
                    : ClearObserver // Clear any and all mutation observers..
                );
                break;
            }
            ar.callback = (ke.shiftKey 
                ? Transform // Transform prices in the HTML DOM..
                : ClearObserver // Clear any and all mutation observers..
            );
            break;
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
export const run = async (action: ActionResult|ActionResultCallback): Promise<ActionResult> => {
    if (!action || (typeof action === 'object' && !action.callback)) {
        return {
            status: Status.Failure,
            message: 'ActionResult or callback missing, nothing to run.',
            data: action
        };
    }

    if (typeof action === 'function') {
        action = {
            status: Status.Running,
            message: 'ActionResult created.',
            callback: action as ActionResultCallback
        }
    }

    if (d.savie.action) {
        if (d.savie.action.callback) {
            return {
                status: Status.Failure,
                message: 'ActionResult can\'t be enqueued without interrupting an existing action.',
                data: action
            };
        }

        d.savie.action.callback = action.callback;
        return {
            status: Status.Running,
            message: 'ActionResult enqueued..',
            data: action
        };
    }

    let interruptCount = 0;
    try {
        d.savie.action =
            await action!.callback!(action);
        
        if (d.savie.action!.callback) {
            d.savie.action.callbackCount = 1;
        }

        // Continue executing returned callbacks, if any..
        while (d.savie.action.callback && ++interruptCount < 96) 
        {
            d.savie.action = 
                await d.savie.action!.callback!(d.savie.action);

            if (d.savie.action.data.callbackCount! > 16) { 
                if (!d.savie.action.data) {
                    d.savie.action.data = {}
                }
                d.savie.action.data.interrupted = true;
                d.savie.action.message = 'Interrupted - ' + d.savie.action.message;
                break;
            }
        }
    }
    catch(ex: any) {
        d.savie.action = {
            status: Status.Failure,
            message: ex.message || JSON.stringify(ex),
            data: {
                error: ex,
                lastCallback: d.savie.action!.callback,
                callbackCount: d.savie.action!.callbackCount,
            }
        }
    }
    finally { 
        switch(d.savie.action!.status) {
            case Status.Success:
                success(d.savie.action!.message, d.savie.action);
                break;
            case Status.PartialSuccess:
                partialSuccess(d.savie.action!.message, d.savie.action);
                break;
            case Status.Running: // Terminated.
                d.savie.action!.status = Status.PartialSuccess;
                partialSuccess(d.savie.action!.message, d.savie.action);
                break;
            case Status.Failure:
                fail(d.savie.action, d.savie.action);
                break;
            default: // Status.Missing
                missing(d.savie.action!.message);
                break;
        }
    }

    return d.savie.action;
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
