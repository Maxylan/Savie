// @Maxylan
import { run, action } from './index';
import { 
    Savie, 
    DocumentExtended, 
    ActionResult, 
    ActionResultCallback,
    Status, 
    Page
} from './types';

// Declare `d` (`DocumentExtended`) and define savie's members.
declare global {
    var d: DocumentExtended;
}
var d = document as DocumentExtended;
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
        valueChange: (id: string, value: string|number) => 
            d.savie.valueChangeCallbacks!.forEach(_ => 
                run({..._, data: { id: id, value: value }})),
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

export default d;
