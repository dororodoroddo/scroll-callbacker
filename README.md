# scroll-callbacker
Lightweight scroll event maker<br>
A library that fires events at specific elements or scroll positions

## usage
```
const sc = new ScrollCallbacker(rootEl);
```
* Set the scrolling eliment when initialization.

```
scrollCallbacker.addTarget(target, callback)
```
* add scrolling target and callback function
* if target is element, is using intersectionObserver.
* if target is object({ position: number }), is using addEventListener.

```
scrollCallbacker.removeTarget(target, callback)
```
* remove target and callback function.
* Must insert same function like using removeEventListener
* If there are no targets left, tracking is automatically distroyed.

## end
* making issue is welcome.


## history
* 1.1.1 - remove unnecessary files on npm
* 1.1.0 - add horizontal scroll detect
* 1.0.0 - published