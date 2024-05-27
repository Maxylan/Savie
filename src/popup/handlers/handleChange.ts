// @Maxylan
import { d } from '../../index';
import { ExtStorage } from '../../types';

/**
 * 
 */
const onIncomeChange = async (e: any, income_id: number) => {
    let storage: ExtStorage = await browser.storage.local.get('incomes');
    let incomeIndex: number = storage.incomes!.findIndex((_:any) => _.id === income_id);

    if (incomeIndex !== -1) { 
        switch(e.target.type) {
            case 'date':
                if (e.target.id.endsWith('start')) {
                    storage.incomes![incomeIndex].start = e.target.value;
                }
                else {
                    storage.incomes![incomeIndex].end = e.target.value;
                }
                break;
            default: // Like 'number', 'slider', elements where we yoink `.value`
                storage.incomes![incomeIndex].value = e.target.value;
                break;
        }
        
        // Logging..
        // const res = await browser.storage.local.set({ incomes: storage.incomes });
        // console.debug('onIncomeChange, res - ', res);

        await browser.storage.local.set(storage);
        switch(e.target.type) {
            case 'date':
                if (e.target.id.endsWith('start')) {
                    d.savie.valueChange(''+income_id, storage.incomes![incomeIndex].start!)
                }
                else {
                    d.savie.valueChange(''+income_id, storage.incomes![incomeIndex].end!)
                }
                break;
            default: // Like 'number', 'slider', elements where we yoink `.value`
                d.savie.valueChange(''+income_id, storage.incomes![incomeIndex].value)
                break;
        }
    }
}

export default onIncomeChange;
