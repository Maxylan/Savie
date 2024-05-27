// @Maxylan
// Misc. global declarations..
// 
export enum Page {
    Settings,
    Incomes
};

export enum Status {
    Success,
    PartialSuccess,
    Running,
    Failure,
    Missing
};

export type ActionResult = {
    status: Status,
    message: string,
    data?: any,
    callback?: ActionResultCallback,
    callbackCount?: number
};

export type ActionResultCallback = 
    (prev?: ActionResult) => Promise<ActionResult>;

export type Savie = {
    init: boolean,
    keyDownEvent: any,
    valueChangeCallbacks: ActionResult[],
    onValueChange: (...callbacks: ActionResultCallback[]) => void,
    valueChange: (id: string, value: string|number) => void,
}

export type DocumentExtended = Document & {
    savie: Savie;
}

export type Income = { 
    id: number,
    value: number,
    start?: string,
    end?: string,
};

export type Settings = {
    buffer: number,
    incomeDeviation: number,
    upfrontCost: number,
    annualGrowth: number
};

export type States = {
    pageSelected: Page
};

export type ExtStorage = { 
    incomes?: Income[],
    settings?: Settings,
    states?: States,
};

// Type-helpers..
//
export type Helement = Node & Element;