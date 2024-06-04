// @Maxylan
import { d } from '../../index.ts';
import { onIncomeInput } from '../handlers/handleInput.ts';
import onIncomeSliderInput from '../handlers/handleSliderInput.ts';
import onIncomeChange from '../handlers/handleChange.ts';
import {
    Savie,
    DocumentExtended,
    ActionResult,
    ActionResultCallback,
    ExtStorage,
    Income,
    Settings,
    States,
    Helement 
} from '../../types.ts';

/**
 * Multiplies the given number (microsecodns) with 1000.
 */
export const s = (microseconds: number = 1): number => microseconds * 1000

/**
 * Formats a number >999 with spaces separating thousands.
 */
export const tF = (num: number|string): string => {
    if (typeof num === 'string') {
        num = parseInt(num.trim());

        if (!num || isNaN(num)) {
            return `${(num ?? '')}`;
        }
    }

    let str = `${num}`.replace(/[SsEeKkRr\:\-]*/g, '').trim();
    let index = (str.length % 3) || 3; // Start..
    let result = str.slice(0, index) + ' ';

    while(
        index < str.length && 
        str.length - index >= 3
    ) {
        result += str.slice(index, (index += 3)) + ' ';
    }
    
    return result;
}

/**
 * Returns a version of `func` that's "debounced"
 */
export const debounce = <TFunction extends Function>(func: TFunction, wait: number = 500): TFunction => {
	var timeout: any;
	return (
        function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                // @ts-ignore
                func.apply(this, arguments);
                // @ts-restore
            }, wait);
        } 
    ) as Function as TFunction;
}

/**
 * Create an HTML Element / Node (`Helement`) from a string-representation.
 *
 * @see https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
 * @param {String} HTML representing a single element.
 * @param {Boolean} flag representing whether or not to trim input whitespace, defaults to true.
 * @return {Element | HTMLCollection | null}
 */
export const stringToHTML = (html: string, trim: boolean = true): Helement => {

    html = trim ? html.trim() : html;
    if (!html) throw new Error('`html` Cannot be falsy.');

    // Set up a new template element.
    const template = d.createElement('template');
    template.innerHTML = html;

    // Then return children as HTMLCollection
    return template.content.children[0]!;
}

/**
 *
 */
export const spawnIncomeFromEvent = async (e: any, inc?: Income) => { 
    let storage: ExtStorage = await browser.storage.local.get('incomes');
    let incomes: Income[] = storage?.incomes ?? [];
    let incomeIDs: number[] = incomes.map(_ => _.id);
    let incomeIndex: number = (inc && incomes.findIndex((_:any) => _.id === inc.id)) ?? -1;
    let maxId: number = 1 + (
        incomes.length && Math.max(...incomeIDs) 
    );

    let newIncome: Income = incomeIndex > -1 
        ? {
            ...incomes[incomeIndex],
            id: maxId
        }
        : { 
            value: e.target?.dataset?.value ?? 0,
            id: maxId
        };

    // Use `inc` values, if given.
    if (inc?.value) { newIncome.value = inc!.value }
    if (inc?.start) { newIncome.start = inc!.start }
    if (inc?.end) { newIncome.end = inc!.end }

    incomes.push(newIncome);    
    
    const incomeForm: Helement = d.querySelector('div#incomes')!;
    spawnIncome(incomeForm, newIncome);

    await browser.storage.local.set({ incomes: incomes });
}

/**
 *
 */
export const spawnIncome = (hookElement: Element, inc: Income) => {
    const id = 'single-income-' + inc.id;
    const singleIncome = stringToHTML('<div class="single-income" id="'+id+'" data-income-id="'+inc.id+'"></div>'); 
    const incomeField = stringToHTML(
        '<fieldset class="income-container">' +
        '<input type="number" id="'+id+'-input" class="income-input" ' +
        'min="0" max="30000" step="100" value="'+inc.value+'">' +
        '<input type="range" id="'+id+'-slider" class="income-slider" '+ 
        'min="0" max="30000" step="100" value="'+inc.value+'">' +
        '</fieldset>'
    );
    
    (incomeField
        .querySelector('input.income-input') as HTMLInputElement)
        .addEventListener('input', (e: any) => onIncomeInput!(e));
    (incomeField
        .querySelector('input.income-slider') as HTMLInputElement)
        .addEventListener('input', (e: any) => onIncomeSliderInput!(e)); 
    (incomeField
        .querySelectorAll('input') as NodeList /* HTMLInputElement[] */)
        .forEach((input: any) => 
            input.addEventListener('change', (e: any) => onIncomeChange!(e, inc.id))
        ); 
    
    const dateField = stringToHTML(
        '<fieldset class="date-container">' +
        '<div class="date-input-start-wrapper">' +
        '<label for="'+id+'-start" class="income-label">From:</label>' +
        '<input type="date" id="'+id+'-start" class="date-input" value="'+inc.start+'">' +
        '</div>' +
        '<div class="date-input-end-wrapper">' +
        '<label for="'+id+'-end" class="income-label">To:</label>' +
        '<input type="date" id="'+id+'-end" class="date-input" value="'+inc.end+'">' +
        '</div>' +
        '</fieldset>'
    );
    
    (dateField
        .querySelectorAll('input') as NodeList /* HTMLInputElement[] */)
        .forEach((input: any) => 
            input.addEventListener('change', (e: any) => onIncomeChange!(e, inc.id))
        ); 

    const singleIncomeInfoAndActions = stringToHTML(
        '<div class="single-income-info-and-actions">' +
        '<div class="single-income-info">' +
        '<p'+(inc.value > 0 ? '':' style="display:none;"')+'>' +
            (inc.value > 0 ? inc.value+' :-':'') +
        '</p>' +
        '</div>' +
        '<div class="single-income-actions">' +
        '<button type="button" class="button copy-single-income" data-value="'+inc.value+'">📋</button>' +
        '<button type="button" class="button remove-single-income">🗑️</button>' +
        '</div>' +
        '</div>'
    );

    (singleIncomeInfoAndActions
        .querySelector('button.copy-single-income') as HTMLButtonElement)
        .addEventListener('click', (e) => spawnIncomeFromEvent(e, inc));
    (singleIncomeInfoAndActions
        .querySelector('button.remove-single-income') as HTMLButtonElement)
        .addEventListener('click', () => singleIncome.remove()); 
    
    singleIncome.append(incomeField as Node);
    singleIncome.append(dateField as Node);
    singleIncome.append(singleIncomeInfoAndActions as Node);
    
    hookElement.append(singleIncome as Node);
};

/**
 *
 */
export const updateIncomeWithValue = (id: number, value: number) => {
    return browser.get.storage.local('incomes').then(
        (_:ExtStorage) => {
            _.incomes ??= [];
            let index = _.incomes.findIndex((inc: Income) => inc.id === id);
            if (index !== -1) { _.incomes[index].value = value; }
        }
    )
}

/**
 * Helper to set the border, and restore it 
 * after `timeout` microseconds.
 *
 * A spin on Mozilla's "Getting Started" guide for extensions!
 */
export const setBorder = (style: string, timeout: number = 3000) => {
    if (!style) { return; }

    // Clear current Border timeout & border (if unchanged), if any..
    if (d.savie.border.timeout) {
        clearTimeout(d.savie.border.timeout);
    }
    if (d.savie.border.current && d.body.style.border === d.savie.border.current) {
        d.body.style.border = d.savie.border.original!;
    }

    // Save border details..
    d.savie.border = {
        // In the unlikely event a border exists, save it.
        original: d.body.style.border
    }

    d.body.style.border = style;
    d.savie.border.current = style;

    // Restore the old body after `timeout` microseconds.
    d.savie.border.timeout = setTimeout(
        () => {
            d.body.style.border = d.savie.border.original!;
            d.savie.border = {};
        }, timeout
    );
}

/**
 * Fires when an action or key can't be found.
 */
export const missing = (status?: string, keyCode?: number) => {
    if (d.savie.debug) {
        setBorder("3px solid yellow", 200);
        console.debug(
            '%c'+(status || 'Action/keyCode not found.')+': ', 
            'color: lightgrey; font-size: 10px;', 
            status, 
            keyCode
        ); 
    }
}

/**
 * Handles visualizing "partial" success:es
 */
export const partialSuccess = (status?: string, result?: ActionResult) => {
    
    let partialSuccessStyle = 'color: burlywood; font-size: 10px;';
    console.debug('%cSavie: ' + (status || 'Partial Success!'), partialSuccessStyle, result);

    if (d.savie.debug) {
        setBorder("4px solid burlywood", 900);
        
        if (result?.callback || result?.callbackCount) {
            console.debug('%cCallback: ' + result.callbackCount, partialSuccessStyle, result.callback);
        }
        if (result?.data) {
            console.debug('%cData: ', partialSuccessStyle, result.data);
        }
    }
}

/**
 * Handles visualizing a completely successfull run!
 */
export const success = (status?: string, result?: ActionResult) => {
    
    let successStyle = 'color: lightgreen; font-size: 10px;';
    console.debug('%cSavie: ' + (status || 'Success!'), successStyle);
    
    if (d.savie.debug) {
        setBorder("4px solid lightgreen", 900);
        
        if (result?.callback || result?.callbackCount) {
            console.debug('%cCallback: ' + result.callbackCount, successStyle, result.callback);
        }
        if (result?.data) {
            console.debug('%cData: ', successStyle, result.data);
        }
    }
}

/**
 * Handles visualizing & logging errors.
 */
export const fail = (ex: any, result?: ActionResult) => {
    setBorder("5px solid red"); // 3s, default timeout.
    console.error('Savie Error: ', ex, result);
    
    if (d.savie.debug) {
        if (result?.callback || result?.callbackCount) {
            console.error('On Callback #' + result.callbackCount, result.callback);
        }

        //...
    }
}
