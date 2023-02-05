import 'intersection-observer';

export interface ScrollPositionParams {
    position: number;
    direction?: 'y' | 'x';
    // callbackDirection?: 'increase' | 'decrease' | 'both';
    // once?: boolean;
}
export interface EventListenerCallback extends Function {
    (entry: Event): void;
}

export interface IntersectionCallback extends Function {
    (entry: IntersectionObserverEntry): void;
}

interface ScrollPosition extends Omit<ScrollPositionParams, 'direction'> {
    callback: EventListenerCallback;
}

type ScrollTagets = {
    [ target in string ]: IntersectionCallback;
}

export const TARGET_ELEMENT_KEY = 'scroll-callbacker-id';

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
    
    
    public addTarget(target: HTMLElement, callback: IntersectionCallback): void;
    public addTarget(target: ScrollPositionParams, callback: EventListenerCallback): void;
    public addTarget(target: ScrollPositionParams | HTMLElement, callback: EventListenerCallback | IntersectionCallback): void {
        if (isElement(target)) {
            this.addIntersectionObserverTarget(target as HTMLElement, callback as IntersectionCallback);
            return;
        }

        if (typeof (target as ScrollPositionParams).position === 'number') {
            this.addEventlistenerTarget(target as ScrollPositionParams, callback as EventListenerCallback);
            return;
        }

        throw new Error('not valid target');
    }

    public removeTarget(target: HTMLElement | ScrollPositionParams, callback: Function): void {
        if (isElement(target)) {
            this.removeIntersectionObserverTarget(target as HTMLElement, callback as IntersectionCallback);
            return;
        }
        
        if (typeof (target as ScrollPositionParams).position === 'number') {
            this.removeEventlistenerTarget(target as ScrollPositionParams, callback as EventListenerCallback);
            return;
        }

        throw new Error('not valid target');        
    }

    public destroyAll() {
        this.disableEventListener('x')
        this.disableEventListener('y')
        this.disableIntersectionObserver();
    }

    /** 이벤트 리스너 방식 */
    private xScrollPositions: ScrollPosition[] = [ { position: -Infinity, callback: ()=>{} }, { position: Infinity, callback: ()=>{} } ];
    private yScrollPositions: ScrollPosition[] = [ { position: -Infinity, callback: ()=>{} }, { position: Infinity, callback: ()=>{} } ];
    private xIndex = 0;
    private yIndex = 0;
    private xTimeoutNumber = -1;
    private yTimeoutNumber = -1;

    private addEventlistenerTarget(target: ScrollPositionParams, callback: EventListenerCallback): void {
        const direction = target.direction  ?? 'y';
        if (direction !== 'x' && direction !== 'y') {
            throw new Error('not valid direction');
        }

        const queue = this[`${direction}ScrollPositions`];
        const len = queue.length;
        if (len === 2) {
            this.initEventListener(direction);
        }

        queue.push({ ...target, callback });

        const sorting = () => { 
            queue.sort((a, b) => a.position - b.position);
            const position = this.$el[`scroll${(direction === 'y') ? 'Top' : 'Left'}`]
            while (this.scrollCompare(position, queue[this[`${direction}Index`] + 1])) {
                ++this[`${direction}Index`];
            }
        };

        window.clearTimeout(this[`${direction}TimeoutNumber`]);
        this[`${direction}TimeoutNumber`] = window.setTimeout(sorting, 0);
    }

    private removeEventlistenerTarget(target: ScrollPositionParams, callback: EventListenerCallback): void {
        const direction = target.direction  ?? 'y';
        const queue = this[`${direction}ScrollPositions`];

        let index = -1;
        const len = queue.length;
        let i = 0;
        for (let jump = len - 1;jump > 0; jump = jump >> 1) {
            while (i + jump < len && queue[i + jump].position < target.position) {
                i += jump;
            }
        }
        ++i;
        while (queue[i].position === target.position) {
            if (queue[i].callback === callback) {
                index = i;
                break;
            }
            ++i;
        };
        if (index === -1) {
            return;
        }
        queue.splice(index, 1);

        if (target.position <= queue[this[`${direction}Index`]].position) {
            --this[`${direction}Index`];
        }

        if (queue.length === 2) {
            this.disableEventListener(direction);
        }
    }

    private initEventListener(direction: 'x' | 'y'): void {
        this[`${direction}Index`] = 0;
        this.$el.addEventListener('scroll', this[`${direction}EventHandler`], { passive: true });
    }

    private disableEventListener(direction: 'x' | 'y'): void {
        this.$el.removeEventListener('scroll', this[`${direction}EventHandler`]);
        this[`${direction}ScrollPositions`] = [ { position: -Infinity, callback: ()=>{} }, { position: Infinity, callback: ()=>{} } ];
    }

    private xEventHandler = (e: Event) => {
        const x = (e.target as HTMLElement).scrollLeft;

        while (this.scrollCompare(x, this.xScrollPositions[this.xIndex + 1])) {
            ++this.xIndex;
            this.xScrollPositions[this.xIndex].callback(e);
        }
        
        while (!this.scrollCompare(x, this.xScrollPositions[this.xIndex])) {
            --this.xIndex;
        }
    }

    private yEventHandler = (e: Event) => {
        const y = (e.target as HTMLElement).scrollTop;

        while (this.scrollCompare(y, this.yScrollPositions[this.yIndex + 1])) {
            ++this.yIndex;
            this.yScrollPositions[this.yIndex].callback(e);
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

    private addIntersectionObserverTarget(target: HTMLElement, callback: IntersectionCallback): void {
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

    private removeIntersectionObserverTarget(target: HTMLElement, callback: IntersectionCallback): void {
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
        this.scrollTargets = {};
        this.observer.disconnect();
        this.observer = null;
    }

    private intersectionObserverCallback = (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                this.scrollTargets[entry.target.getAttribute(TARGET_ELEMENT_KEY) || '']?.(entry);
            }

        })
    }
}

export default ScrollCallbacker;