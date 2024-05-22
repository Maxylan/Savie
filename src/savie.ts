// @Maxylan
import { 
    Status, ActionResult 
} from './index';

declare type Helement = Node & Element;
var d = document as DocumentExtended;
if (!d.savie) {
    d.savie = {}
}

var browser: any = browser;

// Ensure compatibility during testing..
var compat: any = {}
if (!browser) {
    browser = { storage: { local: {
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
d.savie.onSliderInput = (e: any) => {
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
d.savie.onInput = (e: any) => {
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

const spawn = (hookElement: Element) => {
    
    return {
        income: (inc: Income) => {
            const id = 'single-income-' + inc.id;
            const singleIncome = stringToHTML('<div class="single-income" id="'+id+'"></div>'); 
            const incomeField = stringToHTML(
                '<fieldset class="income-container">' +
                '<input type="number" id="'+id+'-input" class="income-input" min="0" max="30000" step="100" value="'+inc.value+'" oninput="document.savie.onInput(event)">' +
                '<input type="range" id="'+id+'-slider" class="income-slider" min="0" max="30000" step="100" value="'+inc.value+'" oninput="document.savie.onSliderInput(event)">' +
                '</fieldset>'
            );
            const dateField = stringToHTML(
                '<fieldset class="date-container">' +
                '<div class="date-input-start-wrapper">' +
                '<label for="'+id+'-start" class="income-label">From:</label>' +
                '<input type="date" id="'+id+'-start" class="date-input">' +
                '</div>' +
                '<div class="date-input-end-wrapper">' +
                '<label for="'+id+'-end" class="income-label">To:</label>' +
                '<input type="date" id="'+id+'-end" class="date-input">' +
                '</div>' +
                '</fieldset>'
            ); 
            const singleIncomeInfoAndActions = stringToHTML(
                '<div class="single-income-info-and-actions">' +
                '<div class="single-income-info">' +
                '<p'+(inc.value > 0 ? '':' style="display:none;"')+'>' +
                    (inc.value > 0 ? inc.value+' :-':'') +
                '</p>' +
                '</div>' +
                '<div class="single-income-actions">' +
                '<button type="button" class="button copy-single-income" disabled="true" onClick="' +
                'document.savie.spawnIncome(event)' +
                '" data-value="'+inc.value+'">📋</button>' +
                '<button type="button" class="button remove-single-income" onClick="' +
                'document.getElementById(\''+id+'\').remove()' +
                '" data-value="'+inc.value+'">🗑️</button>' +
                '</div>' +
                '</div>'
            );
            
            singleIncome.append(incomeField as Node);
            singleIncome.append(dateField as Node);
            singleIncome.append(singleIncomeInfoAndActions as Node);
            
            hookElement.append(singleIncome as Node);
        }
    }
}

/**
 *
 */
d.savie.spawnIncome = async (e: any) => {
    const incomeForm: Helement = d.querySelector('form#income')!;
    
    let incomes: Income[] = (
        await browser.storage.local.get('incomes')
    )?.incomes ?? [];

    let lastId: number = 1 + (incomes.length == 0 ? 0 : Math.max(...incomes.map(_ => _.id)));
    let newIncome: Income = { 
        id: lastId,
        value: e.target?.dataset?.value ?? 0
    }

    spawn(incomeForm).income(newIncome);
    incomes.push(newIncome);

    await browser.storage.local.set({ incomes: incomes });
}

// Init / Start!
document.addEventListener('DOMContentLoaded', async (_) => { 
    const settingsPage: Helement = d.querySelector('.page#settings-page')!;
    const incomePage: Helement = d.querySelector('.page#income-page')!;
    const incomeForm: Helement = d.querySelector('form#income')!;

    // Give one of the forms `.selected`
    // settingsPage.classList.add(selected);
    incomePage.classList.add(selected); 
 
    // Grab `income` from storage, and spawn a 'single-income' per stored income.
    let storage: IncomeStorage = (
        await browser.storage.local.get('incomes')
    );

    if (!storage.incomes) { 
        storage.incomes = [{ 
            value: 0,
            id: 0
        }];

        await browser.storage.local.set(storage);
    };

    storage.incomes.forEach((_: Income) => spawn(incomeForm).income(_));

    d.querySelector('button#add-income')!.addEventListener('click', d.savie.spawnIncome!);
});
