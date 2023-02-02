# scroll-callbacker 스크롤 콜백커
특정 위치 혹은 엘리먼트의 위치로 스크롤을 이동하였을 때, 이벤트를 발생시키기 쉽도록 만들어진 라이브러리

## 특징
* 쉬운 추가와 제거
    * 짧은 코드로 등록한 루트 스크롤 엘리먼트를 대상으로 이벤트를 추가하고 제거할 수 있다. (addEventListener와 마찬가지로 익명함수가 아닌 함수를 등록해야 지울 수 있다.)

* 성능 관리
    * 타겟을 모두 제거한 경우 이벤트 리스너 혹은 옵저버가 제거됨
    * 스크롤 이벤트의 경우 스위핑을 통해 최적화된 비교를 수행

## 사용
```
const sc = new ScrollCallbacker(rootEl);
```
* 스크롤 대상 엘리먼트를 등록한다.

```
scrollCallbacker.addTarget(target, callback)
```
* 콜백을 발생시킬 타겟을 element나 { y: number }로 등록한다.
* 엘리먼트면 intersectionObserver, { y: number }면 y 스크롤 위치에서 콜백이 실행된다.

```
scrollCallbacker.removeTarget(target, callback)
```
* 등록한 타겟과 콜백을 입력하면 콜백 발생이 취소된다.
* 대상이 없으면 intersectionObserver와 이벤트 리스너가 모두 자동으로 해제된다.

## 추가 예정(?)
* once - 한번 실행 후 제거
* 이벤트리스너 타겟에 대한 옵션들
* 오류 발생시 자동 콜백 제거


## 기타
추가 요청 많이 남겨 주시면 기능이 추가될수도 반려될 수도 있습니다.