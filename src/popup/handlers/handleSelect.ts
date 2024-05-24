// @Maxylan
import { Helement } from '../controller';

export const selected = 'selected';
export enum Choose {
    settings = 'choose-settings',
    income = 'choose-income'
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
            case Choose.settings:
                incomePage.querySelector('form#income')!.setAttribute('disabled', 'true');
                break;
            case Choose.income:
                settingsPage.querySelector('form#settings')!.setAttribute('disabled', 'true');
                break;
        }
    }
};

export default selectChoice;
