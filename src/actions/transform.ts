// @Maxylan
// Transforms "prices" on the webpage to interactive dates.
//
import { d } from '../index';
import { Temporal } from '@js-temporal/polyfill'
import { debounce } from '../popup/utils/functions';
import { 
    Status, 
    ActionResult,
    ExtStorage,
    Helement,
    Settings,
    Income
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
            let content: string = (node.textContent ?? '').replace(/[\ SsEeKkRr\:\-]/, '');
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

export type TTA = {
    now: Temporal.ZonedDateTime,
    tz: Temporal.TimeZoneProtocol,
    date: Temporal.ZonedDateTime,
    duration: Temporal.Duration,
    info: { 
        sum: number,
        goal: number,
        buffer: number,
        iterations: number,
        wageIncreases: number
    }
}
/**
 *
 */
export const calculateTTA = (goal: number, settings: Settings, incomes: Income[]): TTA => {

    const now = Temporal.Now.zonedDateTimeISO();
    const tz = now.getTimeZone();

    let pointer = now;
    let wageIncreases = 0,
        wageIncrease = () => 1 + wageIncreases * (settings.annualGrowth / 100);
    let actualGoal = goal + settings.buffer;
    let sum = 0;

    let iterations = 0;
    while(true) {
        if (pointer.day === 25 || pointer.day > 25) {
            pointer = Temporal.ZonedDateTime.from(pointer).with({
                month: pointer.month + 1,
                day: 25
            });
        }
        else {
            pointer = Temporal.ZonedDateTime.from(pointer).with({ day: 25 });
        }

        // Increse wages each April..
        if (pointer.month === 4) {
            ++wageIncreases;
        }

        sum += wageIncrease() * incomes.reduce<number>((acc, cur) => {
            if (cur.start) {
                if (Temporal.ZonedDateTime.compare(pointer, cur.start) === -1) {
                    return acc;
                }
                /* const start = Temporal.ZonedDateTime
                    .from(cur.start)
                    .with({ timeZone: tz });

                if (pointer.epochSeconds < start.epochSeconds) {
                    return acc;
                } */
            }
            if (cur.end) {
                if (Temporal.ZonedDateTime.compare(pointer, cur.end) === 1) {
                    return acc;
                }
                /* const end = Temporal.ZonedDateTime
                    .from(cur.end)
                    .with({ timeZone: tz });

                if (pointer.epochSeconds > end.epochSeconds) {
                    return acc;
                } */
            }
            
            return acc + cur.value;
        }, 0);

        if (sum >= actualGoal || ++iterations > 999) { break; }
    }

    return {
        now: now,
        tz: tz,
        date: pointer,
        duration: now.until(pointer),
        info: { 
            sum: sum,
            goal: goal,
            buffer: settings.buffer,
            iterations: iterations,
            wageIncreases: wageIncreases
        }
    };
}

/**
 * Assuming `node` is an element with a numeric `innerHTML`..
 * Transforms the given HTML Element / Node to a hover, with
 * details about when the user will have saved up to the number.
 */
export const TransformHTML = async (node: Helement, storage?: ExtStorage): Promise<void> => {
    if (!storage) {
        storage = await browser.storage.local.get(['incomes', 'settings']);
    }
    if (!storage || !storage.settings || !storage.incomes) {
        console.warn('TransformHTML - Failed to get `storage`', storage, node);
        return;
    }

    let content: string = (node.textContent ?? '').replace(/[\ SsEeKkRr\:\-]/, '');
    let price: number = parseInt(content);
    if (!price || isNaN(price)) {
        console.warn('TransformHTML - Skipped Node with falsy/NaN text content:', node);
        return;
    }
    
    const tta = calculateTTA(price, storage.settings, storage.incomes);
    console.debug('tta', `${content} - ${tta.date.toLocaleString()}`, tta);

    node.textContent = `${content} - ${tta.date.toLocaleString()}`; 
}

