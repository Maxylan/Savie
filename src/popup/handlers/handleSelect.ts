// @Maxylan
const selected = 'selected';
const choose = {
    settings: 'choose-settings',
    income: 'choose-income'
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
            case choose.settings:
                incomePage.querySelector('form#income')!.setAttribute('disabled', 'true');
                break;
            case choose.income:
                settingsPage.querySelector('form#settings')!.setAttribute('disabled', 'true');
                break;
        }
    }
};
