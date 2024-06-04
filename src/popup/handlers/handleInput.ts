// @Maxylan
import { d } from '../../index.ts';
import { ExtStorage, Helement  } from '../../types.ts';

/**
 * 
 */
export const onIncomeInput = (e: any) => {
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
export const onSettingInputValue = async (e: any) => {
    const storage: ExtStorage = await browser.storage.local.get('settings');
    let updateStorage: boolean = false;
    
    if (!storage.settings) {
        return;
    }
    
    if (isNaN(e.target.value)) {
        return;
    }

    switch(e.target.id) {
        case 'set-buffer-size':
            updateStorage = storage.settings.buffer !== e.target.value; 
            storage.settings.buffer = e.target.value;
            break;
        case 'set-deviation-amount':
            if (e.target.value < 0) { return; }
            updateStorage = storage.settings.incomeDeviation !== e.target.value; 
            storage.settings.incomeDeviation = e.target.value;
            break;
        case 'set-upfront-cost':
            updateStorage = storage.settings.upfrontCost !== e.target.value; 
            storage.settings.upfrontCost = e.target.value;
            break;
        case 'set-yearly-wage-growth':
            updateStorage = storage.settings.annualGrowth !== e.target.value; 
            storage.settings.annualGrowth = e.target.value;
            break;
    }

    if (updateStorage) {
        await browser.storage.local.set(storage);
    }
}
