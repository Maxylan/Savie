// @Maxylan
// Clear any `MutationObservers` running in the background, if any!
//
import { d } from '../index';
import { 
    Status, 
    ActionResult, 
    ExtStorage
} from '../types';

export default async function ClearObserver(): Promise<ActionResult> {    
    const observerExisted = !!d.savie.observer;
    
    if (observerExisted) {
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
