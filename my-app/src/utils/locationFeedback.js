// 서버의 정확도 판정은 유지하고 개발용 수치 안내만 화면에서 제외한다.
export function isLocationAccuracyNotice(error) {
  return /^GPS 정확도가 \d+(?:\.\d+)?m 이내인 위치만 판정할 수 있습니다\.$/.test(error?.message || "");
}
