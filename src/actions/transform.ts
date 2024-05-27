// @Maxylan
// Transforms "prices" on the webpage to interactive dates.
//
import { d } from '../index';
import { debounce } from '../popup/utils/functions';
import { 
    Status, 
    ActionResult,
    ExtStorage,
    Helement
} from '../types';

/**
 * XPath used to find "numbers" (prices) on the website.
 */
export const xpath = "//*[normalize-space() != '' and translate(normalize-space(), '0123456789SsEeKkRr:- ', '') = '']"

export type TransformResult = {
    observer: MutationObserver,
    nodes: Node[]
}

export default async function Transform(): Promise<ActionResult<TransformResult>> {

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
    // console.debug(nodes);

    if (!d.savie.observer) {
        d.savie.observer = new MutationObserver(debounce(Transform));
        d.savie.observer.observe(d.querySelector('body')!, d.savie.observerConfig);
        
        // Do some cleanup, so I don't leave an observer running in the users
        // browser for an eternity...
        setTimeout(
            () => {
                if (d.savie.observer) {
                    d.savie.observer.disconnect();
                    delete d.savie.observer;
                }
            }, d.savie.observerLifespan
        );
    }

    return {
        status: Status.Success,
        message: '',
        data: {
            observer: d.savie.observer,
            nodes: nodes
        }
    };
}
