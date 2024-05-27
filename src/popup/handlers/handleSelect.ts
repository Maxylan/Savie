// @Maxylan
import { d } from '../../index';
import { Page, Helement } from '../../types';

export const selected = 'selected';
export enum Choose {
    settings = 'choose-settings',
    income = 'choose-income'
}

const selectChoice = async (e: any) => {
    let el: Helement = e.target;
    if (!el.classList.contains(selected)) {
        const absoluteSelector: Helement = d.querySelector('#absolute-selector')!;
        const settingsPage: Helement = d.querySelector('.page#settings-page')!;
        const incomePage: Helement = d.querySelector('.page#income-page')!;
        
        settingsPage.classList.toggle(selected);
        incomePage.classList.toggle(selected);
        let selectedPage: Page;

        switch(el.id) {
            case Choose.income:
                settingsPage.querySelector('form[name="settings"]')!.setAttribute('disabled', 'true');
                selectedPage = Page.Incomes;
                break;
            default: // Choose.settings
                incomePage.querySelector('form[name="income"]')!.setAttribute('disabled', 'true');
                selectedPage = Page.Settings;
                break;
        }
        
        // Store selected page..
        await browser.storage.local.set({ states: { pageSelected: selectedPage } });
        
        // Toggle `selected` classes on the "absolute"-selector wrapper.
        absoluteSelector.classList.toggle(`${Choose.settings}-${selected}`);
        absoluteSelector.classList.toggle(`${Choose.income}-${selected}`);
        
        // Toggle `selected` classes on the select-"buttons".
        d.querySelectorAll('#relative-select-wrapper p').forEach(
            (_: any) => (_ as Helement).classList.toggle(selected)
        );
    }
};

export default selectChoice;
