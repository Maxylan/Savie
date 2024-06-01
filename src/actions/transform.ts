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
import { 
    preDefinedTTAIntensities as ttaColors,
    TTA,
    Percent,
    IncomeDataGraph,
    IncomeDatapoint,
    IncomeData,
    Intensity,
    lerp
} from './transformTypes';

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
export const overrideNode = '<span class="savie-overridden-price">$&</span>'
/**
 * Node/Element (Helement) that replaces the selected node's existing content.
 */
export const newNode = '<span class="savie-new-content">$&</span>'
/**
 * Node/Element (Helement) that stores a node's existing content.
 */
export const backupNode = '<span class="savie-old-content-backup">$&</span>'

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
        
        if (![ // **NOT!!!**
            'savie-new-content',
            'savie-old-content-backup',
            'savie-hover',
            'savie-tta-headline',
            'savie-tta-paragraph',
            'savie-graph',
            'savie-income-graph',
            'savie-graph-datapoint',
            'savie-graph-datapoint-graph-content', 
            'savie-graph-datapoint-graph-active',
            'savie-graph-datapoint-graph-inactive' 
        ].some(_ => node.classList.contains(_))) 
        {
            if (node.textContent && pattern.test(node.textContent)) {
                let price: string = node.textContent.replace(pattern, overrideNode);
                let newContent: string = newNode.replace('$&', price);
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
    await Promise.all(
        nodes.map(_ => TransformHTML(_ as Helement, storage))
    );

    console.debug('Post-transform Nodes:', nodes);

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

    const contentBackupNode: Helement|null = node.querySelector('.savie-overridden-price');
    const contentNode: Helement|null = node.querySelector('.savie-new-content');
    const priceNode: Helement|undefined|null = node?.querySelector('.savie-old-content-backup');
    
    if (!contentBackupNode ||
        !contentNode ||
        !priceNode
    ) {
        console.warn('TransformHTML - `node` or its `.textContent` is falsy/undefined: ' + (typeof node));
        return false;
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

    let _mHelper = (
        { years = 0, months = 0 } : { years?: number, months?: number }
    ): number => years * 12 + months
    
    let intensity: {
        factor: number,
        primary: Intensity,
        secondary?: Intensity,
        final: Intensity
    } = {
        factor: 0,
        primary: ttaColors.high,
        final: ttaColors.high
    };

    if (tta.duration.years >= ttaColors.high.startAtYear) {
        if (intensity.secondary) {
            delete intensity.secondary
        }
        intensity.primary = ttaColors.high;
        intensity.factor = 1;
    }
    else if (tta.duration.years >= ttaColors.medium.startAtYear) {
        intensity.primary = ttaColors.medium;
        intensity.secondary = ttaColors.high;
        intensity.factor = 1 / (
            _mHelper({ years: ttaColors.high.startAtYear }) - _mHelper(tta.duration)
        );
    }
    else if (tta.duration.years >= ttaColors.low.startAtYear) {
        intensity.primary = ttaColors.low;
        intensity.secondary = ttaColors.medium;
        intensity.factor = 1 / (
            _mHelper({ years: ttaColors.medium.startAtYear }) - _mHelper(tta.duration)
        );
    }
    else {
        if (intensity.secondary) {
            delete intensity.secondary
        }
        intensity.primary = ttaColors.low;
        intensity.factor = 1;
    }

    intensity.final = intensity.primary

    // Linearly Interpolate (lerp) `primary` & `secondary` to arrive at the `final` intensity.
    if (intensity.secondary) {
        intensity.final = {
            ...intensity.primary,
            backgroundImage: {
                ...intensity.primary.backgroundImage,
                steps: {} // We calculate this below..
            },
            border: {
                ...intensity.primary.border,
                color: lerp(
                    intensity.primary.border.color, 
                    intensity.secondary.border.color, 
                    intensity.factor
                ),
            }
        };

        let primaryKeys = Object.keys(intensity.primary.backgroundImage.steps) as Percent[];
        let secondaryKeys = Object.keys(intensity.secondary.backgroundImage.steps) as Percent[];

        // "Intersect" the keys of `primaryKeys` and `secondaryKeys`
        // Add the result of linearly interpolating the RGB of each key to `final`.
        primaryKeys
            .filter(_ => secondaryKeys.includes(_))
            .forEach(
                _ => intensity.final.backgroundImage.steps[_] = lerp(
                    intensity.primary.backgroundImage.steps[_]!,
                    intensity.secondary!.backgroundImage.steps[_]!,
                    intensity.factor
                )
            );
    }

    console.debug('intensity', intensity);

    const container = stringToHTML(
        '<div class="savie-hover" style="background-image:'+intensity.final.backgroundImage.rule()+'">' +
        '<h4 id="savie-tta-headline"></h4>' +
        '<p id="savie-tta-paragraph"></p>' +
        '</div>'
    );

    const graph = stringToHTML('<div class="savie-graph"></div>');
    
    const incomeGraphContainers: {
        [id: string]: Helement
    } = {};
    storage.incomes.forEach(
        _ => incomeGraphContainers[_.id] = (
            stringToHTML('<div id="savie-graph-'+_.id+'" class="savie-income-graph"></div>')
        )
    );

    tta.incomeGraph.graph.forEach(
        iteration => {
            iteration.data.forEach(
                (point, i) => {
                    const datapoint = 
                        stringToHTML(
                            '<span id="savie-graph-'+point.data.income.id+'-datapoint"' +
                            'class="savie-graph-datapoint" data-index="'+i+'">' + (point.data.active 
                                ? '<span class="savie-graph-datapoint-graph-active"></span>'
                                : '<span class="savie-graph-datapoint-graph-inactive"></span>'
                            ) +
                            '</span>'
                        ),
                        content = stringToHTML(
                            '<span class="savie-graph-datapoint-content">' +
                            (point.data.active ? point.value : 'Not Active') +
                            '</span>'
                        );

                    datapoint.append(content);

                    datapoint.addEventListener('mouseover', function () {
                        (content as HTMLDivElement).style.display = 'initial';
                    });
                    datapoint.addEventListener('mouseout', function () {
                        (content as HTMLDivElement).style.display = 'hidden';
                    });

                    incomeGraphContainers[point.data.income.id].append(datapoint);
                }
            );
        }
    );

    Object.keys(incomeGraphContainers).forEach(
        _ => graph.append(incomeGraphContainers[_])
    );

    container.append(graph);
    contentNode.append(container);

    return true;
}

