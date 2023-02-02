import 'intersection-observer';

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
    private scrollPositions: ScrollPosition[] = [ { y: -Infinity, callbacks: [] }, { y: Infinity, callbacks: [] } ];     // default
    private currentIndex = 0;
    private timeoutNumber = -1;

    private addEventlistenerTarget(target: ScrollPositionParams, callback: Function): void {
        if (this.scrollPositions.length === 2) {
            this.initEventListener();
        }

        let index = -1;
        const len = this.scrollPositions.length;
        for (let i = 0 ; i < len ; ++i) {
            const position = this.scrollPositions[i];
            
            if (position.y === target.y) {
                index = i;
                break;
            }
        };

        if (index === -1) {
            this.scrollPositions.push({
                ...target,
                callbacks: [ callback ],
            });
        } else {
            this.scrollPositions[index].callbacks.push(callback);
        }
        
        const sorting = () => {
            this.scrollPositions.sort((a, b) => a.y - b.y);
        }

        window.clearTimeout(this.timeoutNumber);
        this.timeoutNumber = window.setTimeout(sorting, 0);
    }

    private removeEventlistenerTarget(target: ScrollPositionParams, callback: Function): void {
        removeItemFromArray(this.scrollPositions, target, (compareTarget, item) => {
            if (compareTarget.y !== item.y) {
                return false;
            }

            removeItemFromArray(compareTarget.callbacks, callback, (a, b) => a === b);

            if (compareTarget.callbacks.length === 0) {
                return true;
            }
            return false;
        })

        if (this.scrollPositions.length === 2) {
            this.disableEventListener();
        }
    }

    private initEventListener(): void {
        this.currentIndex = 0;
        this.$el.addEventListener('scroll', this.scrollEventHandler, { passive: true })
    }

    private disableEventListener(): void {
        this.$el.removeEventListener('scroll', this.scrollEventHandler)
    }

    private scrollEventHandler = (e: Event) => {
        const y = (e.target as HTMLElement).scrollTop;

        while (this.scrollCompare(y, this.scrollPositions[this.currentIndex + 1])) {
            ++this.currentIndex;
            this.scrollPositions[this.currentIndex].callbacks.forEach((callback) => callback());
        }
        
        while (!this.scrollCompare(y, this.scrollPositions[this.currentIndex])) {
            --this.currentIndex;
        }
    }

    private scrollCompare(y: number, position: ScrollPosition): boolean {
        if (y - position.y >= 0) {
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