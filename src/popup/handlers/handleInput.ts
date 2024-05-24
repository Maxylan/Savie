// @Maxylan
import { d, Helement } from '../controller';

/**
 * 
 */
const onIncomeInput = (e: any) => {
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

export default onIncomeInput;
