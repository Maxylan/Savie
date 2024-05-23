// @Maxylan
// declare module '*.json';
declare var browser: any;
declare module '*.json';
declare module '*.html';
declare module '*.jpg';
declare module '*.png';
declare module '*.ico';
declare module '*.svg';

type Savie = {
    spawnIncome?: (e: any, inc?: Income) => void,
    keyDownEvent?: any,
    onIncomeSliderInput?: (event: any) => void,
    onIncomeInput?: (event: any) => void,
    onIncomeChange?: (event: any, income_id: number) => void,
}

type DocumentExtended = Document & {
    savie: Savie;
}

declare var d: DocumentExtended;

declare type Income = { 
    id: number,
    value: number,
    start?: string,
    end?: string,
};
declare type IncomeStorage = { 
    incomes?: Income[],
};
