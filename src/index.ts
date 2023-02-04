import 'intersection-observer';

export interface ScrollPositionParams {
    position: number;
    direction?: 'y' | 'x';
    // callbackDirection?: 'increase' | 'decrease' | 'both';
    // once?: boolean;
}

export interface ScrollPosition extends Omit<ScrollPositionParams, 'direction'> {
    callbacks: Function[];
}

export type ScrollTagets = {
    [ target in string ]: Function;
}

const TARGET_ELEMENT_KEY = 'scroll-callbacker-id';

function removeItemFromArray<ArrayItem = any, Target = any>(arr: ArrayItem[], item: Target, f: (item: ArrayItem, target: Target) => boolean): void {
    let index = -1;
    const len = arr.length;

    for (let i = 0 ; i < len ; ++i) {
        const item_i = arr[i];

        if (f(item_i, item)) {
            index = i;
            break
        }
    };

    if (index === -1) {
        return;
    }

    arr.splice(index, 1);
}

function isElement(obj: any) {
    try {
        return obj instanceof HTMLElement;
    } catch {
        return (typeof obj === "object") && (obj.nodeType === 1) && (typeof obj.style === "object") && (typeof obj.ownerDocument === "object");
    }
}

export class ScrollCallbacker {
    private $el!: HTMLElement;
    
    /** 공통 */
    constructor(target: HTMLElement) {
        if (!isElement(target)) {
            throw new Error('cannot found scrollable element')
        }

        this.$el = target;
    }
    
    public addTarget(target: HTMLElement | ScrollPositionParams, callback: Function): void {
        if (isElement(target)) {
            this.addIntersectionObserverTarget(target as HTMLElement, callback);
            return;
        }

        this.addEventlistenerTarget(target as ScrollPositionParams, callback);
    }

    public removeTarget(target: HTMLElement | ScrollPositionParams, callback: Function): void {
        if (isElement(target)) {
            this.removeIntersectionObserverTarget(target as HTMLElement, callback);
            return;
        }

        this.removeEventlistenerTarget(target as ScrollPositionParams, callback);
    }

    /** 이벤트 리스너 방식 */
    private xScrollPositions: ScrollPosition[] = [ { position: -Infinity, callbacks: [] }, { position: Infinity, callbacks: [] } ];     // default
    private yScrollPositions: ScrollPosition[] = [ { position: -Infinity, callbacks: [] }, { position: Infinity, callbacks: [] } ];     // default
    private xIndex = 0;
    private yIndex = 0;
    private timeoutNumber = -1;

    private addEventlistenerTarget(target: ScrollPositionParams, callback: Function): void {
        const direction = target.direction || 'y';
        const queue = this[`${direction}ScrollPositions`];
        const len = queue.length;
        if (len === 2) {
            this.initEventListener(direction);
        }

        let index = -1;
        for (let i = 0 ; i < len ; ++i) {
            const position = queue[i];
            
            if (position.position === target.position) {
                index = i;
                break;
            }
        };

        if (index === -1) {
            queue.push({
                ...target,
                callbacks: [ callback ],
            });

            const sorting = () => {
                queue.sort((a, b) => a.position - b.position);
            }
    
            window.clearTimeout(this.timeoutNumber);
            this.timeoutNumber = window.setTimeout(sorting, 0);
        } else {
            queue[index].callbacks.push(callback);
        }
    }

    private removeEventlistenerTarget(target: ScrollPositionParams, callback: Function): void {
        const direction = target.direction || 'y';
        const queue = this[`${direction}ScrollPositions`];
        removeItemFromArray(queue, target, (compareTarget, item) => {
            if (compareTarget.position !== item.position) {
                return false;
            }

            removeItemFromArray(compareTarget.callbacks, callback, (a, b) => a === b);

            if (compareTarget.callbacks.length === 0) {
                return true;
            }
            return false;
        })

        if (queue.length === 2) {
            this.disableEventListener(direction);
        }
    }

    private initEventListener(direction: 'x' | 'y'): void {
        this[`${direction}Index`] = 0;
        this.$el.addEventListener('scroll', this[`${direction}EventHandler`], { passive: true })
    }

    private disableEventListener(direction: 'x' | 'y'): void {
        this.$el.removeEventListener('scroll', this[`${direction}EventHandler`])
    }

    private xEventHandler = (e: Event) => {
        const x = (e.target as HTMLElement).scrollLeft;

        while (this.scrollCompare(x, this.xScrollPositions[this.xIndex + 1])) {
            ++this.xIndex;
            this.xScrollPositions[this.xIndex].callbacks.forEach((callback) => callback());
        }
        
        while (!this.scrollCompare(x, this.xScrollPositions[this.xIndex])) {
            --this.xIndex;
        }
    }

    private yEventHandler = (e: Event) => {
        const y = (e.target as HTMLElement).scrollTop;

        while (this.scrollCompare(y, this.yScrollPositions[this.yIndex + 1])) {
            ++this.yIndex;
            this.yScrollPositions[this.yIndex].callbacks.forEach((callback) => callback());
        }
        
        while (!this.scrollCompare(y, this.yScrollPositions[this.yIndex])) {
            --this.yIndex;
        }
    }

    private scrollCompare(pos: number, position: ScrollPosition): boolean {
        if (pos - position.position >= 0) {
            return true;
        }

        return false;
    }
    
    /** 인터섹션 옵저버 방식 */
    public rootMargin = '0px';
    public threshold: number | number[] = 1.0;
    private elId = 0;
    private scrollTargets: ScrollTagets = {};
    private observer: IntersectionObserver | null = null;

    private addIntersectionObserverTarget(target: HTMLElement, callback: Function): void {
        if (this.observer === null) {
            this.observer = this.initIntersectionObserver();
        }
        let callbackId = target.getAttribute(TARGET_ELEMENT_KEY);
        
        if (!callbackId) {
            callbackId = `${target.nodeName}-${++this.elId}`;
            target.setAttribute(TARGET_ELEMENT_KEY, callbackId);
        }

        this.scrollTargets[callbackId] = callback;

        this.observer.observe(target);
    }

    private removeIntersectionObserverTarget(target: HTMLElement, callback: Function): void {
        if (this.observer === null) {
            throw new Error('no target')
        }

        this.observer.unobserve(target);
        delete this.scrollTargets[ target.getAttribute(TARGET_ELEMENT_KEY) || '' ];

        if (Object.keys(this.scrollTargets).length === 0) {
            this.disableIntersectionObserver();
        }
    }

    private initIntersectionObserver(): IntersectionObserver {
        const options: IntersectionObserverInit = {
            root: this.$el,
            rootMargin: this.rootMargin,
            threshold: this.threshold,
        }
        return new IntersectionObserver(this.intersectionObserverCallback, options);
    }
    
    private disableIntersectionObserver(): void {
        if (!this.observer) {
            return;
        }
    
        this.observer.disconnect();
        this.observer = null;
    }

    private intersectionObserverCallback = (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                this.scrollTargets[entry.target.getAttribute(TARGET_ELEMENT_KEY) || '']?.();
            }

        })
    }
}

export default ScrollCallbacker;