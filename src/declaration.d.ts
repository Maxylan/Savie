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
    spawnIncome?: (event: any) => void,
    keyDownEvent?: any,
    onSliderInput?: (event: any) => void,
    onInput?: (event: any) => void,
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
