// @Maxylan
// Clear any `MutationObservers` running in the background, if any!
//
import { d } from '../index.ts';
import { 
    Status, 
    ActionResult, 
    ExtStorage
} from '../types.ts';

export default async function ClearObserver(): Promise<ActionResult> {    
    const observerExisted = !!(d.savie.observer || d.savie.observerShutdownTimer);
    
    if (observerExisted) {
        clearTimeout(d.savie.observerShutdownTimer);
        delete d.savie.observerShutdownTimer;

        d.savie.observer!.disconnect();
        delete d.savie.observer;
    }

    return observerExisted ? {
        status: Status.Success,
        message: 'Successfully deleted the active "MutationObserver" instance.'
    } : {
        status: Status.Missing,
        message: 'No active "MutationObserver" instance exists. Nothing to disconnect & delete.'
    };
}
