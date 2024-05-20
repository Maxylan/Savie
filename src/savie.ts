// @Maxylan
import { 
    Storage,
    Store,
    Status, 
    ActionResult 
} from './index';

// Seems I can't log here..
// console.log('Toplevel works!');

document
    .querySelector('button#test')!
    .addEventListener(
        'load', async (e) => {
            // Seems I can't log here..
            // console.log('Event works!', e);
            const storage = await Storage('local', 'tests');
            await Store(
                'local', 
                { key: 'tests', value: ++(storage.tests ?? 0) }
            );
        }
    );
