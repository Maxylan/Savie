// @Maxylan
// Injected with the Popup HTML, controlls menu interactivity and storage.
// 
import { d } from '../index.ts';
import selectChoice, { selected, Choose } from './handlers/handleSelect.ts';
import { onSettingInputValue } from './handlers/handleInput.ts';
import {
    stringToHTML,
    spawnIncomeFromEvent,
    spawnIncome,
} from './utils/functions.ts';
import { 
    Savie,
    DocumentExtended,
    ActionResult,
    ActionResultCallback,
    Status,
    Page,
    Income,
    Settings,
    Helement
} from '../types.ts';

// Init / Start!
document.addEventListener('DOMContentLoaded', async (_) => { 
    const settingsPage: Helement = d.querySelector('.page#settings-page')!;
    const incomePage: Helement = d.querySelector('.page#income-page')!;
    const incomeContainer: Helement = d.querySelector('div#incomes')!;
    const absoluteSelector: Helement = d.querySelector('#absolute-selector')!;
    
    const storage: any = await browser.storage.local.get();
    
    // (Flag if `.set` should be called to set initial states.)
    const performInitialUpdate: boolean = 
        (!storage.incomes || !storage.settings || !storage.states);
    
    // Default `incomes` if unset..
    if (!storage.incomes) { 
        storage.incomes = [{ 
            value: 0,
            id: 0
        }];
    }; 
    // Default `settings` if unset..
    if (!storage.settings) { 
        storage.settings = {
            buffer: 30000,
            incomeDeviation: 1000,
            upfrontCost: 15,
            annualGrowth: 8
        }
    };
    // Default `states` if unset..
    if (!storage.states) { 
        storage.states = {
            pageSelected: Page.Incomes
        }
    };
    
    if (performInitialUpdate) {
        await browser.storage.local.set(storage);
    } 

    // Give one of the forms `.selected`
    switch(storage.states.pageSelected) {
        case Page.Settings:
            settingsPage.classList.add(selected);
            d.querySelector('#'+Choose.settings)!.classList.add(selected);
            absoluteSelector.classList.add(`${Choose.settings}-${selected}`);
            break;
        case Page.Incomes:
            incomePage.classList.add(selected);  
            d.querySelector('#'+Choose.income)!.classList.add(selected);
            absoluteSelector.classList.add(`${Choose.income}-${selected}`);
            break;
    }

    // Init: "Settings" page. \\
    const inputBufferSize: HTMLInputElement = d.querySelector('#set-buffer-size')!;
    inputBufferSize.value = storage.settings.buffer;
    inputBufferSize.addEventListener('input', onSettingInputValue);
    
    const inputDeviationAmount: HTMLInputElement = d.querySelector('#set-deviation-amount')!;
    inputDeviationAmount.value = storage.settings.incomeDeviation;
    inputDeviationAmount.addEventListener('input', onSettingInputValue);

    const inputUpfrontCost: HTMLInputElement = d.querySelector('#set-upfront-cost')!;
    inputUpfrontCost.value = storage.settings.upfrontCost;
    inputUpfrontCost.addEventListener('input', onSettingInputValue);

    const inputWageGrowth:  HTMLInputElement = d.querySelector('#set-yearly-wage-growth')!;
    inputWageGrowth.value = storage.settings.annualGrowth;
    inputWageGrowth.addEventListener('input', onSettingInputValue);

    // Init: "Incomes" page. \\
    // Spawn a 'single-income' per 'stored' income.
    storage.incomes.forEach((_: Income) => spawnIncome(incomeContainer, _));
    d.querySelector('button#add-income')!.addEventListener('click', (e) => spawnIncomeFromEvent(e));
    
    // Add page-selector event handlers.
    d.querySelectorAll('#relative-select-wrapper p').forEach(
        (_: any) => _.addEventListener('click', selectChoice)
    );
});
