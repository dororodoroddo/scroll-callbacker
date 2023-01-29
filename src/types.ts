
export interface ScrollPositionParams {
    y: number;
    // direction?: 'increase' | 'decrease' | 'both';
    // once?: boolean;
}

export interface ScrollPosition extends ScrollPositionParams {
    callbacks: Function[];
}

export type ScrollTagets = {
    [ target in string ]: Function;
}