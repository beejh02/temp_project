export const formatPoints = (value) => `${value.toLocaleString("ko-KR")} NP`;
export const formatPointDate = (value) => new Date(value).toLocaleString("ko-KR", {
  timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
});
