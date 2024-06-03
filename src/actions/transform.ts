// @Maxylan
// Transforms "prices" on the webpage to interactive dates.
//
import { d, run } from '../index';
import { Temporal } from '@js-temporal/polyfill'
import { tF, debounce, stringToHTML } from '../popup/utils/functions';
import { 
    Status, 
    ActionResult,
    ActionResultCallback,
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

/**
 * TODO! Document me! :)
 */
export default async function Transform(prev?: ActionResult, createObserver: boolean = true): Promise<ActionResult> {

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

    // If an observer exists, de-activate it before modifying the DOM 
    // (avoids potential inifinite loops)
    if (d.savie.observer) {
        d.savie.observer.disconnect();
        clearTimeout(d.savie.observerShutdownTimer);

        // Delete the existing one, a new one will be created after
        // tta-calculations and `transformHTML(...)` are done..
        if (createObserver) {
            delete d.savie.observerShutdownTimer;
            delete d.savie.observer;
        }
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
        
        // Prevent matching against nodes with our internal classes.
        // Very ugly, there must be a better way..
        // 
        if (![ // **NOT!!!**
            'savie-new-content',
            'savie-overridden-price',
            'savie-old-content-backup',
            'savie-hover',
            'savie-notransform',
            'savie-tta-headline',
            'savie-tta-paragraph',
            'savie-graph',
            'savie-income-graph',
            'savie-graph-year-separator',
            'savie-graph-datapoint',
            'savie-graph-datapoint-line',
            'savie-graph-datapoint-occasion',
            'savie-graph-datapoint-content',
            'savie-graph-datapoint-active',
            'savie-graph-datapoint-hidden' 
        ].some(_ => node.id === _ || node.classList.contains(_))) 
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

    let dateTime: string = Temporal.Now.zonedDateTimeISO().toLocaleString();
    // console.debug('('+dateTime+') Post `=> TransformHTML(...)` - Nodes:', nodes);

    if (createObserver) { 
        const callback = () => run(() => Transform(prev, false));
        d.savie.observer = new MutationObserver(debounce(callback));
    }

    // If we have a newly created, or disconnected observer instance..
    if (d.savie.observer) {
        d.savie.observer.observe(d.querySelector('body')!, d.savie.observerConfig);
        
        // "Enqueue" some cleanup, I don't want to leave an observer running 
        // in the users browser performing an expensive operation for an eternity...
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
        message: `(${dateTime}) Action \`transform(...)\` transformed ${nodes.length} Nodes.`,
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
    let tta = {
        goal: {
            original: {
                price: goal,
                upfront: goal * (settings.upfrontCost / 100)
            },
            calculated: {
                price: goal + (settings.buffer ?? 0),
                upfront: (goal * (settings.upfrontCost / 100)) + (settings.buffer ?? 0)
            }
        },
        now: now,
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
        if (tta.date.month === 12 && tta.date.day >= 25) {
            tta.date = Temporal.ZonedDateTime.from(tta.date).with({
                year: tta.date.year + 1,
                month: 1,
                day: 25
            });
        }
        else if (tta.date.day === 25 || tta.date.day > 25) {
            tta.date = Temporal.ZonedDateTime.from(tta.date).with({
                month: tta.date.month + 1,
                day: 25
            });
        }
        else {
            tta.date = Temporal.ZonedDateTime.from(tta.date).with({ day: 25 });
        }

        // Increse wages each April..
        if (tta.date.month === 4) {
            ++tta.incomeGraph.wageIncreases;
        }

        let iterationData: IncomeData = {
            sum: 0,
            date: tta.date,
            data: incomes.map<IncomeDatapoint>((inc: Income): IncomeDatapoint => {
                // Compare income `start`/`end` dates (if any) against current `tta.date`
                if ((inc.start && Temporal.PlainDateTime.compare(tta.date, inc.start) === -1) ||
                    (inc.end && Temporal.PlainDateTime.compare(tta.date, inc.end) === 1)
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

        if (tta.incomeGraph.total >= tta.goal.calculated.upfront || ++tta.incomeGraph.iterations > 999) {
            break;
        }
    }

    // Calculate duration..
    tta.duration = tta.now.until(tta.date, { largestUnit: 'year' });

    // Done!
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

    const priceNode: Helement|null = node.querySelector('.savie-overridden-price');
    const contentNode: Helement|null = node.querySelector('.savie-new-content');
    const contentBackupNode: Helement|null = node.querySelector('.savie-old-content-backup');

    if (!contentBackupNode ||
        !contentNode ||
        !priceNode
    ) {
        console.warn('TransformHTML - `node` or its `.textContent` is falsy/undefined: ' + (typeof node));
        return false;
    }
    
    // Inherit padding/margin from the original 
    // content's styles.
    // Fallbacks exists to catch unset values..
    (contentNode as HTMLSpanElement).style.padding = (
        (node as HTMLSpanElement).style.padding || '0.08rem');
    (contentNode as HTMLSpanElement).style.margin = (
        (node as HTMLSpanElement).style.margin || '0 0.16rem');
    (contentNode as HTMLSpanElement).style.display = (
        (node as HTMLSpanElement).style.display || 'initial');

    let numContent: string = priceNode.textContent!.replace(/[\ SsEeKkRr\:\-]/g, '');
    let price: number = parseInt(numContent);
    if (!price || numContent.length < 6 || isNaN(price)) {
        console.warn('TransformHTML - Skipped Node with falsy/short/NaN text content:', node);
        return false;
    }
    
    const tta = calculateTTA(price, storage.settings, storage.incomes);
    // console.debug('tta', tta);

    let calculateIntensityFactor = (
        primary: Intensity,
        secondary: Intensity,
        tta: TTA
    ): number => {
        const _months = (
            { years = 0, months = 0 } : { years?: number, months?: number },
            add: number = 0
        ): number => years * 12 + months + add;

            // "Goal (secondary)" - "Start (primary)" = Steps needed to get to secondary.
        let product = _months({ years: secondary.startAtYear }) - _months({ years: primary.startAtYear }),
            // "Duration" - "Start" = Progress Beyond "Start"
            progress = _months(tta.duration) - _months({ years: primary.startAtYear });

        if (_months(tta.duration) <= 0 ||
            product <= 0 || progress <= 0
        ) {
            return 1;
        }
        
        return 1 / product * progress
    }
    
    let intensity: {
        factor: number,
        primary: Intensity,
        secondary?: Intensity,
        final: Intensity
        note: string
    } = {
        factor: 0,
        primary: ttaColors.high,
        final: ttaColors.high,
        note: '⚠️'
    };

    if (tta.duration.years >= ttaColors.high.startAtYear) {
        if (intensity.secondary) {
            delete intensity.secondary
        }
        intensity.primary = ttaColors.high;
        intensity.factor = 1;
        intensity.note = ['⚰️', '💀', '☣️', '☢️'][Math.floor(4 * Math.random())];
    }
    else if (tta.duration.years >= ttaColors.medium.startAtYear) {
        intensity.primary = ttaColors.medium;
        intensity.secondary = ttaColors.high;
        intensity.factor = calculateIntensityFactor(intensity.primary, intensity.secondary, tta);
        intensity.note = ['😫', '🥺', '🫣', '😓'][Math.floor(4 * Math.random())];
    }
    else if (tta.duration.years >= ttaColors.low.startAtYear) {
        intensity.primary = ttaColors.low;
        intensity.secondary = ttaColors.medium;
        intensity.factor = calculateIntensityFactor(intensity.primary, intensity.secondary, tta);
        intensity.note = ['😳', '🙈', '🤔', '🧐'][Math.floor(4 * Math.random())];
    }
    else {
        if (intensity.secondary) {
            delete intensity.secondary
        }
        intensity.primary = ttaColors.low;
        intensity.factor = 1;
        intensity.note = ['😎', '🤩', '👶', '😻'][Math.floor(4 * Math.random())];
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

    // console.debug('intensity', intensity);
    
    // Style the text-content with the newly calculated intensity.
    priceNode.innerHTML += '&ensp;' + intensity.note;
    let priceColor = lerp({r: 2, g: 2, b: 2}, intensity.final.border.color, 0.64);
    (priceNode as HTMLSpanElement).style.color = `rgb(${priceColor.r}, ${priceColor.g}, ${priceColor.b})`;

    const dateTimeFormat = new Intl.DateTimeFormat('sv-SE', { 
        year: "numeric",
        month: "long",
    });
    
    let dateTimePrint = dateTimeFormat.format(new Date(tta.date.epochMilliseconds));
    dateTimePrint = dateTimePrint[0].toUpperCase() + dateTimePrint.substring(1)
    
    const durationFormat = (duration: Temporal.Duration) => {
        let formatted: string = '';
        if (duration.years > 0) {
            formatted += `${duration.years} Years` 
        }

        formatted += (formatted ? ' and ' : '') + `${duration.months} Months` 

        return formatted;
    }

    let goalPrint = `<strong class="savie-notransform">${tF(tta.goal.calculated.upfront)} :-</strong>&ensp;<i class="savie-notransform">(${storage.settings.upfrontCost}% of ${tF(tta.goal.original.price)}:-, ${(storage.settings.buffer < 0 ? 'minus '+tF(storage.settings.buffer):'plus '+tF(storage.settings.buffer))}:-)</i>`;

    const container = stringToHTML(
        '<div class="savie-hover" style="' +
            'background-image:' + intensity.final.backgroundImage.rule() +
            '; border:' + intensity.final.border.rule()+';">' +
        '<h3 id="savie-tta-headline">' + 
             intensity.note + '&ensp;' + dateTimePrint + /*' ' + intensity.note + */ 
        '</h3>' +
        '<p id="savie-tta-paragraph">' + 
            'You will have saved up..&ensp;<strong class="savie-notransform">' + tF(tta.incomeGraph.total) + ' :-</strong><br/>' +
            '&emsp;│<br/>' +
            '&emsp;├─&ensp;Your goal of..<br/>' +
            '&emsp;│&emsp;&emsp;&ensp;'+goalPrint +'<br/>' +
            '&emsp;╰─&ensp;will be achieved..<br/>' +
            '&emsp;&emsp;&emsp;&emsp;<strong class="savie-notransform">' + durationFormat(tta.duration) + '</strong> from now!' + 
        '</p>' +
        '</div>'
    );

    // Hide the 'savie-hover' container element..
    container.classList.add('savie-hover-hidden');

    const graph = stringToHTML('<div class="savie-graph"></div>');
    
    const incomeGraphContainers: {
        [id: string]: Helement
    } = {};
    storage.incomes.forEach(
        _ => incomeGraphContainers[_.id] = (
            stringToHTML('<div id="savie-graph-'+_.id+'" class="savie-income-graph"></div>')
        )
    );

    let curYear = tta.now.year,
        newYearSeparator = (year: number|string) => stringToHTML(
            '<span class="savie-graph-year-separator" data-year="'+year+'">'+year+'</span>'
        );
    
    tta.incomeGraph.graph.forEach(
        (iteration, it) => {
            if (iteration.date.year !== curYear) {
                curYear = iteration.date.year;
                storage.incomes!.forEach(
                    _ => incomeGraphContainers[_.id].append(
                        newYearSeparator(curYear)
                    )
                );
            }

            iteration.data.forEach(
                (point, i) => {
                    const datapoint = 
                        stringToHTML(
                            '<span id="savie-graph-'+point.data.income.id+'-datapoint" ' +
                            'class="savie-graph-datapoint" ' +
                            'data-iteration="'+it+'" data-year="'+curYear+'" data-index="'+i+'">' +
                            '</span>'
                        ),
                        graphLine = stringToHTML(
                            '<span class="savie-graph-datapoint-line">' +
                                '<span class="savie-graph-datapoint-occasion">' +
                            '</span>'
                        ),
                        content = stringToHTML(
                            '<span class="savie-graph-datapoint-content savie-graph-datapoint-hidden">' +
                                (point.data.active ? tF(point.value) + ':-' : 'Not Active') +
                            '</span>'
                        );

                    if (!point.data.active) {
                        graphLine.classList.add('savie-graph-datapoint-inactive');
                    }

                    // Because when .css doesn't want to cooperate..
                    // border-left: #15141A 1px solid;
                    // border-right: #15141A 1px solid;
                    if (it === 0) {
                        (datapoint as HTMLSpanElement).style.borderLeft = '#15141A 1px solid';
                    }
                    else if (it === tta.incomeGraph.graph.length - 1) {
                        (datapoint as HTMLSpanElement).style.borderRight = '#15141A 1px solid';
                    }

                    graphLine.append(content);
                    datapoint.append(graphLine);

                    datapoint.addEventListener('mouseenter', function () {
                        content.classList.remove('savie-graph-datapoint-hidden');
                        graphLine.classList.add('savie-graph-datapoint-hover');
                    });
                    datapoint.addEventListener('mouseleave', function () {
                        graphLine.classList.remove('savie-graph-datapoint-hover');
                        content.classList.add('savie-graph-datapoint-hidden');
                    });

                    incomeGraphContainers[point.data.income.id].append(datapoint);
                }
            );
        }
    );

    Object.keys(incomeGraphContainers).forEach(
        _ => graph.append(incomeGraphContainers[_])
    );
    
    node.addEventListener('mouseenter',
        _ => container.classList.remove('savie-hover-hidden')
    );
    (container as HTMLDivElement).addEventListener('mouseleave',
        _ => container.classList.add('savie-hover-hidden')
    );

    const newContentRect = contentNode.getBoundingClientRect();
    (container as HTMLDivElement).style.top = `${window.scrollY + newContentRect.top}px`; 
    (container as HTMLDivElement).style.left = `${window.scrollX + newContentRect.left}px`; 

    container.append(graph);
    d.querySelector('body')!.append(container);

    return true;
}

