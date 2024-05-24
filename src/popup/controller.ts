// @Maxylan
import selectChoice, { selected } from './handlers/handleSelect';
import {
    stringToHTML,
    spawnIncomeFromEvent,
    spawnIncome,
} from './utils/functions';

export type Helement = Node & Element;
export const d: DocumentExtended = document as DocumentExtended;
if (!d.savie) {
   d.savie = {};
}

export enum Page {
    Settings,
    Incomes
}

var compat: any = {}
// Ensure compatibility during testing..
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

// Init / Start!
document.addEventListener('DOMContentLoaded', async (_) => { 
    const settingsPage: Helement = d.querySelector('.page#settings-page')!;
    const incomePage: Helement = d.querySelector('.page#income-page')!;
    const incomeContainer: Helement = d.querySelector('div#incomes')!;
    
    const storage: any = await browser.storage.local.get();
    console.log('load, get: ', storage);
    
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
        storage.settings = {}
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
    switch(storage.states) {
        case Page.Settings:
            settingsPage.classList.add(selected);
            break;
        case Page.Incomes:
            incomePage.classList.add(selected);  
            break;
    }

    // Init: "Settings" page. \\
 
    // Init: "Incomes" page. \\
    // Spawn a 'single-income' per 'stored' income.
    storage.incomes.forEach((_: Income) => spawnIncome(incomeContainer, _));
    d.querySelector('button#add-income')!.addEventListener('click', (e) => spawnIncomeFromEvent(e));
});
