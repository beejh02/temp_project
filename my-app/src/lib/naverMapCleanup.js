export function safelyDetachNaverMapObject(mapObject) {
  try {
    mapObject?.setMap?.(null);
  } catch {
    // SDK 인증/네트워크 실패 중에는 전역 지도 객체가 먼저 정리될 수 있다.
  }
}

export function safelyRemoveNaverMapListener(eventApi, listener) {
  try {
    eventApi?.removeListener?.(listener);
  } catch {
    // 실패한 SDK 인스턴스의 정리 오류가 React 화면까지 중단시키지 않게 한다.
  }
}
