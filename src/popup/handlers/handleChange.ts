// @Maxylan
/**
 * 
 */
d.savie.onIncomeChange = async (e: any, income_id: number) => {
    let storage: IncomeStorage = await browser.storage.local.get('incomes');
    console.log('change - e, income_id', e, income_id, storage);
    let incomeIndex: number = storage.incomes!.findIndex((_:any) => _.id === income_id);

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
        
        const res = await browser.storage.local.set({ incomes: storage.incomes });
        // const res = await browser.storage.local.set(storage);
        console.log('set: ', storage, res);
    }
}
