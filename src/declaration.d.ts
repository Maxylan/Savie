// @Maxylan
// declare module '*.json';
declare module '*.json';
declare module '*.html';
declare module '*.jpg';
declare module '*.png';
declare module '*.ico';
declare module '*.svg';
declare var browser: any;

type Savie = {
    keyDownEvent?: any,
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
