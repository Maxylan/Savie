// @Maxylan
import { 
    Status, ActionResult 
} from './index';

declare type Helement = Node & Element;
var d = document as DocumentExtended;
if (!d.savie) {
    d.savie = {}
}

// Ensure compatibility during testing..
declare var browser: any;
var compat: any = {}

if (typeof browser === 'undefined') {
    var fallback: any = { storage: { local: {
        get: async (..._key: any[]): Promise<any> => {
            if (!_key || !_key[0]) { 
                return compat;
            }

            let store: any = {};
            [..._key].forEach((_: any) => {
                store[_] = compat[_]
            });
            
            return Promise.resolve(store);
        },
        set: async (_kvp: any): Promise<any> => compat = {...compat, ..._kvp} 
        /* Object.keys(_kvp).forEach(_k => compat[_k] = _kvp[_k]); */
    }}}

    // Ensure `browser` is defined without overwriting the real one
    if (typeof browser === 'undefined') {
        (window as any).browser = fallback;
    }
}

const selected = 'selected';
const choose = {
    settings: 'choose-settings',
    income: 'choose-income'
}
const selectChoice = (e: any) => {
    let el: Helement = e.target;
    if (!el.classList.contains(selected)) {
        el.classList.add(selected)

        const settingsPage: Helement = d.querySelector('.page#settings-page')!;
        const incomePage: Helement = d.querySelector('.page#income-page')!;
        
        settingsPage.classList.toggle(selected);
        incomePage.classList.toggle(selected);

        switch(el.id) {
            case choose.settings:
                incomePage.querySelector('form#income')!.setAttribute('disabled', 'true');
                break;
            case choose.income:
                settingsPage.querySelector('form#settings')!.setAttribute('disabled', 'true');
                break;
        }
    }
};


/**
 * @param {String} HTML representing a single element.
 * @param {Boolean} flag representing whether or not to trim input whitespace, defaults to true.
 * @return {Element | HTMLCollection | null}
 * @see https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
 */
function stringToHTML(html: string, trim: boolean = true): Helement {

    html = trim ? html.trim() : html;
    if (!html) throw new Error('`html` Cannot be falsy.');

    // Set up a new template element.
    const template = d.createElement('template');
    template.innerHTML = html;

    // Then return children as HTMLCollection
    return template.content.children[0]!;
}

const updateIncomeWithValue = (id: number, value: number) => {
    return browser.get.storage.local('incomes').then(
        (_: IncomeStorage) => {
            _.incomes ??= [];
            let index = _.incomes.findIndex((inc: Income) => inc.id === id);
            if (index !== -1) { _.incomes[index].value = value; }
        }
    )
}

/**
 * 
 */
d.savie.onIncomeSliderInput = (e: any) => {
    const id = e.target.id.substr(0, e.target.id.length - 7);
    const input: HTMLInputElement|null = d.querySelector(`#${id}-input`);
    const info: HTMLElement|null = d.querySelector(`#${id} .single-income-info p`);
    const buttons: NodeList = d.querySelectorAll(`#${id} .single-income-actions button`);

    if (input) { input.value = e.target.value; }
    if (info) { 
        info.style.display = e.target.value > 0
            ? 'initial'
            : 'none';
        info.innerHTML = e.target.value + ' :-';
    }

    buttons.forEach((b: Node) => (b as Helement).setAttribute('data-value', e.target.value));
}

/**
 * 
 */
d.savie.onIncomeInput = (e: any) => {
    const id = e.target.id.substr(0, e.target.id.length - 6);
    const slider: HTMLInputElement|null = d.querySelector(`#${id}-slider`);
    const info: HTMLElement|null = d.querySelector(`#${id} .single-income-info p`);
    const buttons: NodeList = d.querySelectorAll(`#${id} .single-income-actions button`);

    if (slider) { slider.value = e.target.value; }
    if (info) { 
        info.style.display = e.target.value > 0
            ? 'initial'
            : 'none';
        info.innerHTML = e.target.value + ' :-';
    }

    buttons.forEach((b: Node) => (b as Helement).setAttribute('data-value', e.target.value));
}

/**
 * 
 */
d.savie.onIncomeChange = async (e: any, income_id: number) => {
    let storage: IncomeStorage = await browser.storage.local.get('incomes');
    console.log('change - e, income_id', e, income_id, storage);
    let incomeIndex: number = storage.incomes!.findIndex((_:any) => _.id === income_id);

    if (incomeIndex !== -1) { 
        switch(e.target.type) {
            case 'date':
                console.log('Curious..', e.target.value);
                if (e.target.id.endsWith('start')) {
                    storage.incomes![incomeIndex].start = e.target.value;
                }
                else {
                    storage.incomes![incomeIndex].end = e.target.value;
                }
                break;
            default: // Like 'number', 'slider', elements where we yoink `.value`
                storage.incomes![incomeIndex].value = e.target.value;
                break;
        }
        
        const res = await browser.storage.local.set({ incomes: storage.incomes });
        // const res = await browser.storage.local.set(storage);
        console.log('set: ', storage, res);
    }
}

function spawnIncome(hookElement: Element, inc: Income) {
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
        .addEventListener('input', (e: any) => d.savie!.onIncomeInput!(e));
    (incomeField
        .querySelector('input.income-slider') as HTMLInputElement)
        .addEventListener('input', (e: any) => d.savie!.onIncomeSliderInput!(e)); 
    (incomeField
        .querySelectorAll('input') as NodeList /* HTMLInputElement[] */)
        .forEach((input: any) => 
            input.addEventListener('change', (e: any) => d.savie!.onIncomeChange!(e, inc.id))
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
            input.addEventListener('change', (e: any) => d.savie!.onIncomeChange!(e, inc.id))
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
        .addEventListener('click', (e) => {
            console.log('click', inc);
            d.savie!.spawnIncome!(e, inc)
        });
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
d.savie.spawnIncome = async (e: any, inc?: Income) => { 
    let storage: IncomeStorage = await browser.storage.local.get('incomes');
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

// Init / Start!
document.addEventListener('DOMContentLoaded', async (_) => { 
    const settingsPage: Helement = d.querySelector('.page#settings-page')!;
    const incomePage: Helement = d.querySelector('.page#income-page')!;
    const incomeContainer: Helement = d.querySelector('div#incomes')!;

    // Give one of the forms `.selected`
    // settingsPage.classList.add(selected);
    incomePage.classList.add(selected); 
 
    // Grab `income` from storage, and spawn a 'single-income' per stored income.
    let storage: IncomeStorage = await browser.storage.local.get('incomes');
    console.log('load, get: ', storage);

    if (!storage.incomes) { 
        storage.incomes = [{ 
            value: 0,
            id: 0
        }];

        await browser.storage.local.set({ incomes: storage.incomes });
    };
 
    storage.incomes.forEach((_: Income) => spawnIncome(incomeContainer, _));

    d.querySelector('button#add-income')!.addEventListener('click', d.savie.spawnIncome!);
});
