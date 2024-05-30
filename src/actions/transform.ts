// @Maxylan
// Transforms "prices" on the webpage to interactive dates.
//
import { d } from '../index';
import { Temporal } from '@js-temporal/polyfill'
import { debounce, stringToHTML } from '../popup/utils/functions';
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
export const xpath = "//*[" + (
    // [0123456789SsEeKkRr:- ]
    '0123456789'.split('').map(_ => `contains(text(), '${_}')`).join(' or ')
) +"]"
/**
 * Regex pattern used to filter the textContent of nodes 
 * containing found by the `xpath` to contain numbers.
 */
export const pattern = /[0-9SsEeKkRr\ \:\-]{9,}/g
/**
 * Node/Element (Helement) containing the price that we're overriding.
 */
export const overrideNode = '<span class="overridden-price">$&</span>'
/**
 * Node/Element (Helement) that replaces the selected node's existing content.
 */
export const newContent = '<span class="new-content">$&</span>'
/**
 * Node/Element (Helement) that stores a node's existing content.
 */
export const backupNode = '<span class="old-content-backup">$&</span>'

export type TransformResult = {
    observer: MutationObserver,
    nodes: Node[]
}

export default async function Transform(): Promise<ActionResult> {

    const storage: ExtStorage = await browser.storage.local.get(['incomes', 'settings']);
    if (!storage || !storage.settings || !storage.incomes) {
        return Promise.resolve({
            status: Status.Failure,
            message: `Failed to get storage {${typeof storage}}: ` +
                '.settings: ' + (!!storage?.settings ? 'exists':typeof storage?.settings) + ' ' +
                '.incomes: ' + (!!storage?.incomes ? 'exists':typeof storage?.incomes),
            data: storage,
        });
    }
    if (!storage.settings.upfrontCost || storage.settings.upfrontCost <= 0.1) {
        return Promise.resolve({
            status: Status.Failure,
            message: `settings.upfrontCost is invalid (falsy / <= 0.1) {${typeof storage.settings.upfrontCost}}: ` + storage.settings.upfrontCost,
            data: storage,
        });
    }
    if (!storage.incomes.length || storage.incomes.every(_ => _.value <= 0)) {
        return Promise.resolve({
            status: Status.Failure,
            message: `No income stored. (incomes.length === falsy || income.every ... <= 0) {${typeof storage.incomes.length}}: ` + storage.incomes.length,
            data: storage,
        });
    }
    if (storage.incomes.some(_ => _.value < 0)) {
        return Promise.resolve({
            status: Status.Failure,
            message: `Some invalid incomes. (incomes.any ... < 0) {${typeof storage.incomes.length}}: ` + storage.incomes.length,
            data: storage,
        });
    }

    const nodes: Node[] = [], nodesIterator = document.evaluate(
        xpath, 
        document, 
        undefined, 
        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE
    );

    let i = 0;
    while(true) {
        let node = nodesIterator.snapshotItem(i) as Helement;
        if (!node || ++i > 99999) { break; }
        
        if (!node.classList.contains('overridden-price') &&
            !node.classList.contains('new-content') &&
            !node.classList.contains('old-content-backup')
        ) {
            if (node.textContent && pattern.test(node.textContent)) {
                let price: string = node.textContent.replace(pattern, overrideNode);
                let newContent: string = backupNode.replace('$&', price);
                let oldContent: string = backupNode.replace('$&', node.innerHTML!);
                
                if (newContent) {
                    node.innerHTML = newContent + oldContent;
                    nodes.push(node);
                }
            }
        }
    }

    if (!nodes || !nodes.length) {
        return Promise.resolve({
            status: Status.PartialSuccess,
            message: 'Found no nodes/elements to convert.',
            data: {
                storage: storage,
                xpath: xpath,
                nodesResultType: XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                nodesIterator: nodesIterator,
                nodes: nodes
            }
        });
    }

    // Transform each node's HTML Content with the calculated TTA (Time-To-Afford)
    nodes.forEach(_ => TransformHTML(_ as Helement, storage));
    console.log('nodes', nodes);

    if (d.savie.observer) {
        clearTimeout(d.savie.observerShutdownTimer);
        delete d.savie.observerShutdownTimer;
        
        d.savie.observer.disconnect();
        delete d.savie.observer;
    }
    
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
    

    return {
        status: Status.Success,
        message: '',
        data: {
            observer: d.savie.observer,
            nodes: nodes
        }
    };
}

export interface IncomeDatapoint {
    value: number,
    data: { 
        income: Income,
        active: boolean,
    }
}
export interface IncomeData {
    sum: number,
    date: Temporal.ZonedDateTime,
    data: IncomeDatapoint[]
}
export type IncomeDataGraph = {
    graph: IncomeData[],
    wageIncreases: number,
    iterations: number,
    total: number
}

export type TTA = {
    /** (upfrontCost * price) */
    goal: number,
    /** goal + Buffer incl. */
    actualGoal: number,
    /** Current ZonedDateTime */
    now: Temporal.ZonedDateTime,
    /** Timezone Used for zoned-dates */
    tz: Temporal.TimeZoneProtocol,
    /** TTA (Time-To-Afford) date. */
    date: Temporal.ZonedDateTime,
    /** TTA (Time-To-Afford) duration. (`date` minus `now`) */
    duration: Temporal.Duration,
    /** Accumulation of data from the recursive calulations below. */
    incomeGraph: IncomeDataGraph
}

/**
 *
 */
export const calculateTTA = (goal: number, settings: Settings, incomes: Income[]): TTA => {

    const wageIncrease = () => 1 + tta.incomeGraph.wageIncreases * (settings.annualGrowth / 100);
    let now = Temporal.Now.zonedDateTimeISO();
    let pointer = now;
    let tta = {
        goal: goal,
        actualGoal: goal + settings.buffer,
        now: now ,
        tz: now.getTimeZone(),
        date: now,
        duration: Temporal.Duration.from({ seconds: 0 }),
        incomeGraph: {
            graph: [],
            wageIncreases: 0,
            iterations: 0,
            total: 0
        } as IncomeDataGraph
    };

    while(true) {
        if (pointer.month === 12 && pointer.day >= 25) {
            pointer = Temporal.ZonedDateTime.from(pointer).with({
                year: pointer.year + 1,
                month: 1,
                day: 25
            });
        }
        else if (pointer.day === 25 || pointer.day > 25) {
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
            ++tta.incomeGraph.wageIncreases;
        }

        let iterationData: IncomeData = {
            sum: 0,
            date: structuredClone(pointer),
            data: incomes.map<IncomeDatapoint>((inc: Income): IncomeDatapoint => {
                // Compare income `start`/`end` dates (if any) against current `pointer`
                if ((inc.start && Temporal.PlainDateTime.compare(pointer, inc.start) === -1) ||
                    (inc.end && Temporal.PlainDateTime.compare(pointer, inc.end) === 1)
                ) {
                    return {
                        value: 0,
                        data: { 
                            income: inc,
                            active: false,
                        }
                    };
                }
                
                return {
                    value: wageIncrease() * inc.value,
                    data: { 
                        income: inc,
                        active: (wageIncrease() * inc.value) > 0,
                    }
                };
            })
        };

        iterationData.sum = iterationData.data.reduce<number>((acc, cur) => acc + cur.value, 0);
        tta.incomeGraph.total += iterationData.sum;
        tta.incomeGraph.graph.push(iterationData);

        if (tta.incomeGraph.total >= tta.actualGoal || ++tta.incomeGraph.iterations > 999) {
            break;
        }
    }

    return tta;
}

/**
 * Assuming `node` is an element with a numeric `innerHTML`..
 * Transforms the given HTML Element / Node to a hover, with
 * details about when the user will have saved up to the number.
 */
export const TransformHTML = async (node: Helement, storage?: ExtStorage): Promise<boolean> => {
    if (!storage) {
        storage = await browser.storage.local.get(['incomes', 'settings']);
    }
    if (!storage || !storage.settings || !storage.incomes) {
        console.warn('TransformHTML - Failed to get `storage`', storage, node);
        return false;
    }

    const contentBackupNode: Helement|null = node.querySelector('.overridden-price');
    const contentNode: Helement|null = node.querySelector('.new-content');
    const priceNode: Helement|undefined|null = contentNode?.querySelector('.old-content-backup');
    
    if (!contentBackupNode ||
        !contentNode ||
        !priceNode
    ) {
        throw new Error('TransformHTML - `node` or its `.textContent` is falsy/undefined: ' + (typeof node));
    }

    let numContent: string = priceNode.textContent!.replace(/[\ SsEeKkRr\:\-]/g, '');
    let price: number = parseInt(numContent);
    if (!price || numContent.length < 6 || isNaN(price)) {
        console.warn('TransformHTML - Skipped Node with falsy/short/NaN text content:', node);
        return false;
    }

    // Re-format numContent into a nicer-looking string.
    let i = 0, sep = numContent.length % 3;
    let formattedContent = numContent.slice(0, sep);
    while(sep < numContent.length && ++i < 9999) { 
        formattedContent += numContent.slice(sep, (sep += 3));
    }
    
    const tta = calculateTTA(price, storage.settings, storage.incomes);
    console.debug('tta', `${numContent} - ${tta.date.toLocaleString()}`, tta);

    const container = stringToHTML('<>')
    priceNode.textContent = `${numContent} - ${tta.date.toLocaleString()}`; 
    return true;
}

