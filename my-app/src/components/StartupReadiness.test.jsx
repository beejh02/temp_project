import { StrictMode } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import StartupProvider from "./StartupProvider";
import StoreLayer from "./StoreLayer";
import MissionDemoProvider from "./MissionDemoProvider";
import NaverMap from "./NaverMap";
import useStartup from "../hooks/useStartup";

const mapLoader = vi.hoisted(() => ({
  load: vi.fn(),
  subscribeFailure: vi.fn(() => () => {}),
}));
vi.mock("../lib/naverMaps", () => ({
  getNaverMapStyleId: () => "",
  loadNaverMaps: mapLoader.load,
  subscribeNaverMapsFailure: mapLoader.subscribeFailure,
}));

function TaskStatus() {
  const { tasks } = useStartup();
  return tasks.map(({ id, status }) => <span key={id} data-testid={id}>{status}</span>);
}

function TrackingRoot({ children }) {
  return (
    <MemoryRouter>
      <StartupProvider><TaskStatus />{children}</StartupProvider>
    </MemoryRouter>
  );
}

function deferred() {
  let resolve;
  const promise = new Promise((complete) => { resolve = complete; });
  return { promise, resolve };
}

const response = (body) => ({ ok: true, json: async () => body });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("startup readiness integration", () => {
  it("지도 없이 시작한 점포 요청도 실제 응답이 도착해야 준비 완료가 된다", async () => {
    const request = deferred();
    vi.stubGlobal("fetch", vi.fn(() => request.promise));
    render(<TrackingRoot><StoreLayer map={null} /></TrackingRoot>);
    expect(screen.getByTestId("stores")).toHaveTextContent("pending");

    await act(async () => request.resolve(response([])));

    expect(screen.getByTestId("stores")).toHaveTextContent("ready");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("map")).toHaveTextContent("pending");
  });

  it("StrictMode에서 취소된 점포 응답은 현재 요청을 완료 처리하지 않는다", async () => {
    const cancelled = deferred();
    const active = deferred();
    vi.stubGlobal("fetch", vi.fn()
      .mockReturnValueOnce(cancelled.promise)
      .mockReturnValueOnce(active.promise));
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<StrictMode><TrackingRoot><StoreLayer map={null} /></TrackingRoot></StrictMode>);

    await act(async () => cancelled.resolve(response([])));
    expect(screen.getByTestId("stores")).toHaveTextContent("pending");
    await act(async () => active.resolve({ ok: false, status: 503 }));
    expect(screen.getByTestId("stores")).toHaveTextContent("error");
  });

  it("StrictMode에서 취소된 미션 응답은 무시하고 현재 요청의 검증 결과를 반영한다", async () => {
    const cancelled = deferred();
    const active = deferred();
    vi.stubGlobal("fetch", vi.fn()
      .mockReturnValueOnce(cancelled.promise)
      .mockReturnValueOnce(active.promise));
    render(<StrictMode><TrackingRoot><MissionDemoProvider /></TrackingRoot></StrictMode>);

    await act(async () => cancelled.resolve(response([])));
    expect(screen.getByTestId("missions")).toHaveTextContent("pending");
    await act(async () => active.resolve(response({ invalid: true })));
    expect(screen.getByTestId("missions")).toHaveTextContent("error");
  });

  it("지도 SDK가 대기 중이면 진행을 보류하고 실제 지도 생성 후 완료한다", async () => {
    const sdk = deferred();
    mapLoader.load.mockReturnValueOnce(sdk.promise);
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    const mapReady = vi.fn();
    render(<TrackingRoot><NaverMap onMapReady={mapReady} /></TrackingRoot>);
    expect(screen.getByTestId("map")).toHaveTextContent("pending");

    await act(async () => sdk.resolve({
      LatLng: class {},
      Map: class { setCenter() {} },
      Position: { TOP_RIGHT: 3 },
      Event: { trigger: vi.fn() },
    }));

    expect(mapReady).toHaveBeenCalledWith(expect.any(Object));
    expect(screen.getByTestId("map")).toHaveTextContent("ready");
  });

  it("지도 연결 실패는 완료로 가장하지 않고 오류 상태로 종료한다", async () => {
    mapLoader.load.mockRejectedValueOnce(new Error("지도 서버 연결 실패"));
    render(<TrackingRoot><NaverMap /></TrackingRoot>);

    await waitFor(() => expect(screen.getByTestId("map")).toHaveTextContent("error"));
    expect(screen.getByRole("alert")).toHaveTextContent("지도를 불러오지 못했습니다.");
  });

  it("지도 생성 후 도착한 인증 실패도 반영해 완료 상태를 잘못 유지하지 않는다", async () => {
    let reportSdkFailure;
    mapLoader.subscribeFailure.mockImplementationOnce((listener) => {
      reportSdkFailure = listener;
      return () => {};
    });
    mapLoader.load.mockResolvedValueOnce({
      LatLng: class {},
      Map: class { setCenter() {} },
      Position: { TOP_RIGHT: 3 },
      Event: { trigger: vi.fn() },
    });
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    const mapReady = vi.fn();
    render(<TrackingRoot><NaverMap onMapReady={mapReady} /></TrackingRoot>);
    await waitFor(() => expect(screen.getByTestId("map")).toHaveTextContent("ready"));
    expect(screen.getByTestId("markets")).toHaveTextContent("pending");

    act(() => reportSdkFailure(new Error("지도 SDK 인증 실패")));

    expect(screen.getByTestId("map")).toHaveTextContent("error");
    expect(screen.getByRole("alert")).toHaveTextContent("지도 SDK 인증 실패");
    expect(mapReady).toHaveBeenLastCalledWith(null);
  });
});
