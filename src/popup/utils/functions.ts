// @Maxylan
import { Helement } from '../controller'

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
export const updateIncomeWithValue = (id: number, value: number) => {
    return browser.get.storage.local('incomes').then(
        (_: IncomeStorage) => {
            _.incomes ??= [];
            let index = _.incomes.findIndex((inc: Income) => inc.id === id);
            if (index !== -1) { _.incomes[index].value = value; }
        }
    )
}