// @Maxylan
//
import { Temporal } from '@js-temporal/polyfill'
import { 
    Status, 
    Settings,
    Income
} from '../types';

export interface IncomeDatapoint {
    value: number,
    data: { 
        income: Income,
        active: boolean,
    }
}
export interface IncomeData {
    sum: number,
    date: Temporal.ZonedDateTime,
    data: IncomeDatapoint[]
}
export type IncomeDataGraph = {
    graph: IncomeData[],
    wageIncreases: number,
    iterations: number,
    total: number
}
export interface Goal {
    price: number,
    upfront: number
};

export type TTA = {
    goal: {
        original: Goal,
        calculated: Goal
    },
    /** Current ZonedDateTime */
    now: Temporal.ZonedDateTime,
    /** Timezone Used for zoned-dates */
    tz: Temporal.TimeZoneProtocol,
    /** TTA (Time-To-Afford) date. */
    date: Temporal.ZonedDateTime,
    /** TTA (Time-To-Afford) duration. (`date` minus `now`) */
    duration: Temporal.Duration,
    /** Accumulation of data from the recursive calulations below. */
    incomeGraph: IncomeDataGraph
}
export interface RGB {
    r: number,
    g: number,
    b: number,
}

export type Percent = '0%'|'1%'|'2%'|'3%'|'4%'|'5%'|'6%'|'7%'|'8%'|'9%'|'10%'|'11%'|'12%'|'13%'|'14%'|'15%'|'16%'|'17%'|'18%'|'19%'|'20%'|'21%'|'22%'|'23%'|'24%'|'25%'|'26%'|'27%'|'28%'|'29%'|'30%'|'31%'|'32%'|'33%'|'34%'|'35%'|'36%'|'37%'|'38%'|'39%'|'40%'|'41%'|'42%'|'43%'|'44%'|'45%'|'46%'|'47%'|'48%'|'49%'|'50%'|'51%'|'52%'|'53%'|'54%'|'55%'|'56%'|'57%'|'58%'|'59%'|'60%'|'61%'|'62%'|'63%'|'64%'|'65%'|'66%'|'67%'|'68%'|'69%'|'70%'|'71%'|'72%'|'73%'|'74%'|'75%'|'76%'|'77%'|'78%'|'79%'|'80%'|'81%'|'82%'|'83%'|'84%'|'85%'|'86%'|'87%'|'88%'|'89%'|'90%'|'91%'|'92%'|'93%'|'94%'|'95%'|'96%'|'97%'|'98%'|'99%'|'100%';

export type IntensityStep = Partial<{
    [step in Percent]: RGB;
}>;
export type Intensity = {    
    startAtYear: number,
    backgroundImage: {
        rule: () => string,
        steps: IntensityStep
    },
    border: {
        rule: () => string,
        thickness: number,
        color: RGB
    }
};

export const preDefinedTTAIntensities: {
    low: Intensity,
    medium: Intensity,
    high: Intensity
} = {
    low: {
        startAtYear: 2,
        backgroundImage: {
            rule: function () {
                return 'linear-gradient(340deg, ' + (Object.keys(this.steps) as Percent[]).map(_ => `rgb(${this.steps[_]!.r},${this.steps[_]!.g},${(this.steps[_] as RGB)!.b}) ${_}`).join(', ') + ')'
            },
            steps: {
                '0%': { r: 250, g: 250, b: 250 },
                '64%': { r: 235, g: 251, b: 229 },
                '79%': { r: 219, g: 252, b: 207 },
                '87%': { r: 202, g: 254, b: 185 },
                '92%': { r: 185, g: 255, b: 164 },
                '95%': { r: 165, g: 255, b: 143 },
                '97%': { r: 140, g: 255, b: 117 },
                '99%': { r: 114, g: 255, b: 92 },
                '100%': { r: 65, g: 255, b: 51 }
            }
        },
        border: {
            rule: function () {
                return `${this.thickness}px rgb(${this.color.r}, ${this.color.g}, ${this.color.b}) solid`
            },
            thickness: 1,
            color: { r: 114, g: 255, b: 92 },
        }
    },
    medium: {
        startAtYear: 5,
        backgroundImage: {
            rule: function () {
                return 'linear-gradient(345deg, ' + (Object.keys(this.steps) as Percent[]).map(_ => `rgb(${this.steps[_]!.r},${this.steps[_]!.g},${(this.steps[_] as RGB)!.b}) ${_}`).join(', ') + ')'
            },
            steps: {
                '0%': { r: 250, g: 250, b: 250 },
                '64%': { r: 253, g: 249, b: 227 },
                '79%': { r: 255, g: 250, b: 209 },
                '87%': { r: 255, g: 251, b: 189 },
                '92%': { r: 255, g: 251, b: 163 },
                '95%': { r: 255, g: 251, b: 143 },
                '97%': { r: 255, g: 253, b: 122 },
                '99%': { r: 255, g: 233, b: 97 },
                '100%': { r: 255, g: 255, b: 66 }
            }
        },
        border: {
            rule: function () {
                return `${this.thickness}px rgb(${this.color.r}, ${this.color.g}, ${this.color.b}) solid`
            },
            thickness: 2,
            color: { r: 255, g: 233, b: 97 },
        }
    },
    high: {
        startAtYear: 8,
        backgroundImage: {
            rule: function () {
                return 'linear-gradient(350deg, ' + (Object.keys(this.steps) as Percent[]).map(_ => `rgb(${this.steps[_]!.r},${this.steps[_]!.g},${(this.steps[_] as RGB)!.b}) ${_}`).join(', ') + ')'
            },
            steps: {
                '0%': { r: 250, g: 250, b: 250 },
                '64%': { r: 254, g: 227, b: 221 },
                '79%': { r: 255, g: 206, b: 194 },
                '87%': { r: 255, g: 182, b: 163 },
                '92%': { r: 254, g: 162, b: 139 },
                '95%': { r: 250, g: 140, b: 112 },
                '97%': { r: 244, g: 116, b: 87 },
                '99%': { r: 238, g: 88, b: 58 },
                '100%': { r: 230, g: 46, b: 25 }
            }
        },
        border: {
            rule: function () {
                return `${this.thickness}px rgb(${this.color.r}, ${this.color.g}, ${this.color.b}) solid`
            },
            thickness: 3,
            color: { r: 238, g: 88, b: 58 },
        }
    }
}; 


export const lerp = (c1: RGB, c2: RGB, t: number): RGB => {
    const interpolate = (x1: number, x2: number, _t: number) => x1 * (1 - _t) + x2 * _t;
    return {
        r: interpolate(c1.r, c2.r, t),
        g: interpolate(c1.g, c2.g, t),
        b: interpolate(c1.b, c2.b, t)
    }
};

