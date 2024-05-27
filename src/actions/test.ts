// @Maxylan
import { 
    Status, 
    ActionResult, 
    ExtStorage
} from '../types';

export default async function Test(): Promise<ActionResult> {    
    const storage: ExtStorage = await browser.storage.local.get();

    return {
        status: Status.Success,
        message: 'Savie Storage Test',
        data: storage,
        // callback?: (prev) => ActionResult
    };
}
