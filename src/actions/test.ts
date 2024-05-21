// @Maxylan
import { 
    Status, ActionResult 
} from '../index';

export default async function Test(): Promise<ActionResult> {
    
    const storage = await browser.storage.local.get(null);
    return {
        status: Status.Success,
        message: 'Savie Storage Test',
        data: storage,
        // callback?: (prev) => ActionResult
    };
}
