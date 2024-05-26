// @Maxylan

// Declare Modules
declare module '*.json';
declare module '*.html';
declare module '*.jpg';
declare module '*.png';
declare module '*.ico';
declare module '*.svg';

// Misc. global declarations..
// 
type Savie = {
    keyDownEvent?: any,
    onValuesChangeCallbacks?: ((id: string, value: string|number) => void)[],
    onValuesChange?: (callback: ((id: string, value: string|number) => void)) => void,
    valuesChange?: (id: string, value: string|number) => void,
}

type DocumentExtended = Document & {
    savie: Savie;
}

declare enum Page {
    Settings,
    Incomes
}

declare var d: DocumentExtended;
declare var browser: any;

declare type Income = { 
    id: number,
    value: number,
    start?: string,
    end?: string,
};
declare type Settings = {
    buffer: number,
    incomeDeviation: number,
    upfrontCost: number,
    annualGrowth: number
};
declare type States = {
    pageSelected: Page
};

declare type ExtStorage = { 
    incomes?: Income[],
    settings?: Settings,
    states?: States,
};
