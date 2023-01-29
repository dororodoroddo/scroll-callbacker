function isElement(obj: any) {
    try {
      return obj instanceof HTMLElement;
    }
    catch(e){
      return (typeof obj==="object") && (obj.nodeType===1) && (typeof obj.style === "object") && (typeof obj.ownerDocument ==="object");
    }
  }

export type ScrollPosition = {
    y: number;
}

export type AddTargetOption = {
    threshold: number;
}

export class ScrollTrackingManager {
    private $el!: HTMLElement;
    private scrollTargets: HTMLElement[] = [];
    private scrollPositions: ScrollPosition[] = [];
    private observer: IntersectionObserver|null = null;

    /** 공통 */
    constructor(target: HTMLElement) {
        if (!isElement(target)) {
            throw new Error('cannot found scrollable element')
        }

        this.$el = target;

        console.log('sc tracker init')
    }
    
    public addTarget(target: HTMLElement | ScrollPosition, callback: Function, options?: AddTargetOption) {
        if (isElement(target)) {
            this.addIntersectionObserverTarget(target as HTMLElement, callback);
            return;
        }

        this.addEventlistenerTarget(target as ScrollPosition, callback);
    }

    public removeTarget(target: HTMLElement | ScrollPosition) {
        if (isElement(target)) {
            this.removeIntersectionObserverTarget(target as HTMLElement);
            return;
        }

        this.removeEventlistenerTarget(target as ScrollPosition);
    }

    /** 이벤트 리스너 방식 */
    private addEventlistenerTarget(target: ScrollPosition, callback: Function) {
        if (this.scrollPositions.length === 0) {
            this.initEventListener();
        }
    }

    private removeEventlistenerTarget(target: ScrollPosition) {
        
        if (this.scrollPositions.length === 0) {
            this.disableEventListener();
        }
    }

    private initEventListener() {
        this.$el.addEventListener('scroll', this.scrollEventHandler, { passive: true })
    }

    private disableEventListener() {
        this.$el.removeEventListener('scroll', this.scrollEventHandler)
    }

    private scrollEventHandler(e: Event) {

    }
    
    /** 인터섹션 옵저버 방식 */
    private addIntersectionObserverTarget(target: HTMLElement, callback: Function) {
        if (this.observer === null) {
            this.initIntersectionObserver();
        }
    }

    private removeIntersectionObserverTarget(target: HTMLElement) {


        if (this.scrollTargets.length === 0) {
            this.disableIntersectionObserver();
        }
    }

    private initIntersectionObserver() {
        const options: IntersectionObserverInit = {
            root: this.$el,
            rootMargin: `0`,
            threshold: 1.0,
        }
        this.observer = new IntersectionObserver(this.intersectionObserverCallback, options)
    }
    
    private disableIntersectionObserver() {
        this.observer = null;
    }

    private intersectionObserverCallback() {

    }
}

export default ScrollTrackingManager;