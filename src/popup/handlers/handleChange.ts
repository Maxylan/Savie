// @Maxylan
/**
 * 
 */
const onIncomeChange = async (e: any, income_id: number) => {
    let storage: ExtStorage = await browser.storage.local.get('incomes');
    let incomeIndex: number = storage.incomes!.findIndex((_:any) => _.id === income_id);
    console.log('change - e, income_id', e, income_id, storage);

    if (incomeIndex !== -1) { 
        switch(e.target.type) {
            case 'date':
                console.log('Curious..', e.target.value);
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
        
        // const res = await browser.storage.local.set({ incomes: storage.incomes });
        await browser.storage.local.set(storage);
    }
}

export default onIncomeChange;
