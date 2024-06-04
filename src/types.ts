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

export type ActionResult<T = any> = {
    status: Status,
    message: string,
    data?: T,
    callback?: ActionResultCallback,
    callbackCount?: number
};

export type ActionResultCallback = 
    (prev?: ActionResult, ...rest: any) => Promise<ActionResult>;

export type Savie = {
    init: boolean,
    debug: boolean,
    border: { 
        original?: string,
        current?: string,
        timeout?: any
    },
    /** Currently-executing.. */
    action?: ActionResult,
    observer?: MutationObserver,
    observerShutdownTimer?: number,
    observerConfig: MutationObserverInit,
    observerLifespan: number,
    valueChangeCallbacks: ActionResult[],
    onValueChange: (...callbacks: ActionResultCallback[]) => void,
    keyDownEvent: (e: Event) => Promise<any>,
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
