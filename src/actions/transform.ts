// @Maxylan
import { 
    Status, 
    ActionResult,
    ExtStorage,
    Helement
} from '../types';

/**
 * XPath used to find "numbers" (prices) on the website.
 */
export const xpath = "//*[normalize-space() != '' and translate(normalize-space(), '0123456789sekr:- ', '') = '']"

export default async function Transform(): Promise<ActionResult> {

    const storage: ExtStorage = await browser.storage.local.get(['incomes', 'settings']);
    const nodes: Node[] = [], nodesIterator = document.evaluate(
        xpath, 
        document, 
        undefined, 
        XPathResult.UNORDERED_NODE_ITERATOR_TYPE
    );

    let i = 0;
    while(true) {
        let node = nodesIterator.iterateNext();
        if (node) {
            let content: string = node.textContent ?? ''.replace(/[\ SsEeKkRr\:\-]/, '');
            if (content && content.length > 6 && !isNaN(parseInt(content))) {
                nodes.push(node); 
            }
        }
        if (!node || ++i > 99999) { break; }
    }

    nodes.forEach(_ => (_ as Helement).innerHTML += '🥴');
    console.debug(nodes);

    return {
        status: Status.Success,
        message: 'Hello, Savie!',
        data: storage,
        // callback?: (prev) => ActionResult
    };
}
