// @Maxylan
import { 
    Status, ActionResult 
} from './index';
declare type Helement = Node & Element;
declare var browser: any;

// Testing compatibility:
let compat = {}
if (!browser) {
    var browser: any = { storage: { local: {
        get: async (_k: any): Promise<any> => (compat as any)[_k] ?? {},
        set: async (_kvp: any): Promise<any> => compat = {...compat, ..._kvp}/* Object.keys(_kvp).forEach(_k => compat[_k] = _kvp[_k]); */
    }}}
}
/*
IDs:

    root
    select
    relative-select-wrapper
    choose-settings
    choose-income
    absolute-selector
    settings-page
    settings
    add-income
    income-page
    income
    form-submit

Classes:

    button
    select-choice
    selected
    page
    single-income
    remove-single-income
    income-container
    income-input
    income-label
    income-slider
    date-input

Elements:

    header
    div
    fieldset
    span
    form
    footer
*/

const selected = 'selected';
const choose = {
    settings: 'choose-settings',
    income: 'choose-income'
}
const selectChoice = (e: any) => {
    let el: Helement = e.target;
    if (!el.classList.contains(selected)) {
        el.classList.add(selected)

        const settingsPage: Helement = document.querySelector('.page#settings-page')!;
        const incomePage: Helement = document.querySelector('.page#income-page')!;
        
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
    const template = document.createElement('template');
    template.innerHTML = html;

    // Then return children as HTMLCollection
    return template.content.children[0]!;
}

const spawn = (hookElement: Element) => {
    
    return {
        income: (inc: Income) => {
            const id = 'single-income-' + inc.id;
            const singleIncome = stringToHTML('<div class="single-income" id="'+id+'"></div>'); 
            const removeSingleIncome = stringToHTML(
                '<button type="button" class="button remove-single-income" onClick="' +
                'document.getElementById(\''+id+'\').remove()' +
                '">🗑️</button>'
            );
            const incomeField = stringToHTML(
                '<fieldset class="income-container">' +
                '<input type="number" id="'+id+'-input" class="income-input" min="0" max="30000" step="10" value="'+inc.income+'">' +
                '<label for="'+id+'-slider" class="income-label">'+inc.income+'</label>' +
                '<input type="range" id="'+id+'-slider" class="income-slider" min="0" max="30000" step="10" value="'+inc.income+'">' +
                '</fieldset>'
            );
            const dateField = stringToHTML(
                '<fieldset class="date-container">' +
                '<label for="'+id+'-start" class="income-label">From</label>' +
                '<input type="date" id="'+id+'-start" class="date-input">' +
                '<label for="'+id+'-end" class="income-label">To</label>' +
                '<input type="date" id="'+id+'-end" class="date-input">' +
                '</fieldset>'
            ); 
            
            singleIncome.append(removeSingleIncome as Node);
            singleIncome.append(incomeField as Node);
            singleIncome.append(dateField as Node);
            
            hookElement.append(singleIncome as Node);
        }
    }
}

// Init / Start!
document.addEventListener('DOMContentLoaded', async (_) => { 
    const settingsPage: Helement = document.querySelector('.page#settings-page')!;
    const incomePage: Helement = document.querySelector('.page#income-page')!;

    // Give one of the forms `.selected`
    // settingsPage.classList.add(selected);
    incomePage.classList.add(selected); 
 
    // Income Page
    const incomeForm: Helement = document.querySelector('form#income')!;
    
    // Grab `income` from storage, and spawn a 'single-income' per stored income.
    let storage: IncomeStorage = await browser.storage.local.get('income');
    if (!storage.income) { 
        storage.income = [{ 
            id: 0,
            income: 0
        }];
    };

    storage.income.forEach(_ => spawn(incomeForm).income(_));

    document
        .querySelector('button#add-income')!
        .addEventListener('click', async (e) => {
            let incomes: Income[] = (await browser.storage.local.get('income'))?.income ?? [];
            let lastId: number = 1 + (incomes.length == 0 ? 0 : Math.max(...incomes.map(_ => _.id)));
            let newIncome: Income = { 
                id: lastId,
                income: 0
            }

            spawn(incomeForm).income(newIncome);
            incomes.push(newIncome);

            await browser.storage.local.set({ income: incomes });
        });
});
