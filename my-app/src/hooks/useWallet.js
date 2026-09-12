import { useEffect, useState } from "react";
import useMissionDemo from "./useMissionDemo";
import { apiFetch } from "../utils/api";

export default function useWallet() {
  const { loadStatus, errorMessage, refreshMissions } = useMissionDemo();
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    // 일일 미션 응답에서 익명 세션 쿠키를 받은 뒤 같은 세션으로 조회한다.
    if (loadStatus !== "success") return undefined;
    let disposed = false;
    let loading = false;
    let timer;
    let controller;
    const load = async () => {
      if (disposed || loading) return;
      if (document.visibilityState === "hidden") return;
      loading = true;
      controller = new AbortController();
      try {
        const response = await apiFetch("/api/wallet", { signal: controller.signal });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || "포인트를 불러오지 못했어요.");
        if (!data || !Number.isInteger(data.balance) || !Number.isInteger(data.totalEarned)
          || !Number.isInteger(data.totalSpent) || !Array.isArray(data.transactions)) {
          throw new Error("포인트 응답 형식이 올바르지 않습니다.");
        }
        if (!disposed) { setWallet(data); setError(""); }
      } catch (cause) {
        if (!disposed && cause.name !== "AbortError") setError(cause.message);
      } finally {
        loading = false;
        if (!disposed) timer = window.setTimeout(load, 7500);
      }
    };
    const resume = () => {
      if (document.visibilityState === "visible") {
        window.clearTimeout(timer);
        load();
      }
    };
    load();
    document.addEventListener("visibilitychange", resume);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", resume);
    };
  }, [loadStatus, reload]);

  return {
    wallet,
    error: loadStatus === "error" ? errorMessage || "미션 서버에 연결할 수 없어요." : error,
    refresh: () => {
      setError("");
      if (loadStatus === "error") refreshMissions();
      else setReload((value) => value + 1);
    },
  };
}
