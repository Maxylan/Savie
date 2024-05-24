// @Maxylan
import { 
    Status, ActionResult 
} from '../index';

export default async function Test(): Promise<ActionResult> {    
    const storage: Storage = await browser.storage.local.get();

    return {
        status: Status.Success,
        message: 'Savie Storage Test',
        data: storage,
        // callback?: (prev) => ActionResult
    };
}
