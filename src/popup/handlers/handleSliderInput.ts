// @Maxylan
import { d } from '../../index.ts';
import { Helement } from '../../types.ts';

/**
 * 
 */
const onIncomeSliderInput = (e: any) => {
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

export default onIncomeSliderInput;
