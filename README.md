# scroll-callbacker 스크롤 콜백커
특정 위치 혹은 엘리먼트의 위치로 스크롤을 이동하였을 때, 이벤트를 발생시키기 쉽도록 만들어진 라이브러리

## 특징
* 쉬운 추가와 제거
```
scrollCallbacker.addTarget(target, callback)
scrollCallbacker.removeTarget(target, callback)
```
짧은 코드로 등록한 루트 스크롤 엘리먼트를 대상으로 이벤트를 추가하고 제거할 수 있다. (addEventListener와 마찬가지로 익명함수가 아닌 함수를 등록해야 지울 수 있다.)

* 성능 관리
    * 타겟을 모두 제거한 경우 이벤트 리스너 혹은 옵저버가 제거됨
    * 스크롤 이벤트의 경우 스위핑을 통해 최적화된 비교를 수행
