# scroll-callbacker [#한국어 설명(korean language)](https://dororodoroddo.blogspot.com/)
Lightweight scroll event maker<br>
A library that fires events at specific elements or scroll positions

## usage
```
<script src="https://unpkg.com/scroll-callbacker@1.1.4/index.js"></script>
```
* using npm or download directly from a CDN via a script tag

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
* 1.1.6 - refactoring, modifing error exception, change parameter types, add a function to find the current index, add destroyAll function.
* 1.1.5 - add parameter at callback functions
* 1.1.4 - fix bug when set a x with y at the same time
* 1.1.3 - tsc build....
* 1.1.1 - remove unnecessary files on npm
* 1.1.0 - add horizontal scroll detect
* 1.0.0 - published