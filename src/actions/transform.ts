// @Maxylan
import { 
    Status, ActionResult 
} from '../index';

export const xpath = "//*[contains(translate(., '€KRONOR:-SEK', '€kronor:-sek'), '€') or contains(translate(., '€KRONOR:-SEK', '€kronor:-sek'), 'kr') or contains(translate(., '€KRONOR:-SEK', '€kronor:-sek'), 'kronor') or contains(translate(., '€KRONOR:-SEK', '€kronor:-sek'), ':-') or contains(translate(., '€KRONOR:-SEK', '€kronor:-sek'), 'sek') or normalize-space(translate(., '0123456789', '0123456789')) != '']"

export default async function Transform(): Promise<ActionResult> {

    const storage = await browser.storage.local.get(['incomes', 'settings']);
    return {
        status: Status.Success,
        message: 'Hello, Savie!',
        data: storage,
        // callback?: (prev) => ActionResult
    };
}
