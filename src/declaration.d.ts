// @Maxylan
// declare module '*.json';
declare var browser: any;
declare module '*.json';
declare module '*.html';
declare module '*.jpg';
declare module '*.png';
declare module '*.ico';
declare module '*.svg';


declare type Income = { 
    id: number,
    income: number,
    start?: string,
    end?: string,
};
declare type IncomeStorage = { 
    income?: Income[],
};
