const KEY = "nurigo.pending-exchange.v1";

export function readPendingExchange() {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY));
    return typeof value?.benefitId === "string" && /^[0-9a-f-]{36}$/i.test(value?.requestId)
      ? value : null;
  } catch { return null; }
}

export function savePendingExchange(value) {
  // 저장소가 차단돼도 현재 화면에서는 같은 요청 번호로 재시도한다.
  try {
    if (value) sessionStorage.setItem(KEY, JSON.stringify(value));
    else sessionStorage.removeItem(KEY);
  } catch { /* 브라우저 저장소를 사용할 수 없는 환경 */ }
}
