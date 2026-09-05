import { act, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import MissionDemoProvider from "../components/MissionDemoProvider";
import MissionDetailPage from "./MissionDetailPage";
import UserMapPage from "./UserMapPage";
import { demoMarket, demoMission } from "../test/missionDemoFixture";

vi.mock("../components/NaverMap", async () => {
  const { useEffect } = await import("react");
  return { default: function MapStub({ onMapReady }) {
    useEffect(() => { onMapReady({ panTo: vi.fn(), setZoom: vi.fn() }); }, [onMapReady]);
    return null;
  } };
});
vi.mock("../components/MarketPolygon", () => ({ default: () => null }));
vi.mock("../components/StoreLayer", () => ({ default: () => null }));
vi.mock("../components/MapSearch", () => ({ default: () => null }));
vi.mock("../components/MissionLayer", () => ({
  default: ({ missions }) => missions.map((mission) => (
    <Link key={mission.id} to={`/missions/${mission.id}`}>
      지도 미션 상태: {mission.status}
    </Link>
  )),
}));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete window.naver;
});

it("위치 판정·보상 후 지도로 돌아오면 시연 위치와 속도를 이어간다", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-05T12:00:00Z"));
  const markerPositions = [];
  window.naver = { maps: {
    LatLng: class { constructor(lat, lng) { this.lat = lat; this.lng = lng; } },
    Marker: class {
      constructor({ position }) { markerPositions.push(position); }
      setPosition() {}
      setMap() {}
    },
  } };
  const completed = { ...demoMission, status: "completed",
    progress: { current: 1, target: 1, label: "방문 완료" } };
  const response = (body) => ({ ok: true, json: async () => body });
  let resolveCompletion;
  let locationCount = 0;
  let apiMission = demoMission;
  const fetchMock = vi.fn(async (url) => {
    if (url === "/api/missions/daily") return response([apiMission]);
    if (url === "/api/markets") return response([demoMarket]);
    if (url.startsWith("/api/markets/location?")) return response([]);
    if (url === "/api/missions/27/claim") {
      apiMission = { ...completed, status: "claimed" };
      return response(apiMission);
    }
    if (url === "/api/missions/location") {
      locationCount += 1;
      if (locationCount === 1) return response([demoMission]);
      if (locationCount > 2) return response([apiMission]);
      return new Promise((resolve) => { resolveCompletion = resolve; });
    }
    throw new Error(`예상하지 않은 요청: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter><MissionDemoProvider><Routes>
      <Route path="/" element={<UserMapPage />} />
      <Route path="/missions/:missionId" element={<MissionDetailPage />} />
    </Routes></MissionDemoProvider></MemoryRouter>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByText("위치 시연"));
  fireEvent.click(screen.getByRole("button", { name: "시연 시작" }));
  await act(async () => {});
  vi.setSystemTime(new Date("2026-09-05T12:00:02Z"));
  fireEvent.keyDown(window, { key: "w" });
  await act(async () => {});

  const locationCalls = fetchMock.mock.calls.filter(([url]) => url === "/api/missions/location");
  expect(locationCalls).toHaveLength(2);
  expect(locationCalls[1][1].credentials).toBe("include");
  expect(JSON.parse(locationCalls[1][1].body)).toMatchObject({
    latitude: expect.closeTo(36.32695), longitude: 127.4274, accuracy: 5,
  });
  expect(screen.getByText("지도 미션 상태: available")).toBeInTheDocument();

  fireEvent.keyDown(window, { key: "PageUp" });
  await act(async () => {
    apiMission = completed;
    resolveCompletion(response([completed]));
  });
  fireEvent.click(screen.getByRole("link", { name: "지도 미션 상태: completed" }));
  fireEvent.click(screen.getByRole("button", { name: /보상/ }));
  await act(async () => {});
  expect(screen.getByText("5 NP를 받았어요!")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/missions/27/claim",
    expect.objectContaining({ method: "POST", credentials: "include" }));

  await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
  expect(locationCount).toBe(2);
  fireEvent.click(screen.getByRole("button", { name: "지도 보기", exact: true }));
  await act(async () => {});

  expect(screen.getByText(/시연 위치 · 시연 점포/)).toBeInTheDocument();
  expect(markerPositions.at(-1)).toMatchObject({
    lat: expect.closeTo(36.32695), lng: 127.4274,
  });
  fireEvent.keyDown(window, { key: "w" });
  await act(async () => {});
  const continued = fetchMock.mock.calls.filter(([url]) => url === "/api/missions/location");
  expect(continued).toHaveLength(3);
  expect(JSON.parse(continued[2][1].body).latitude).toBeCloseTo(36.32705);
  expect(screen.getByText("지도 미션 상태: claimed")).toBeInTheDocument();

  vi.stubGlobal("navigator", { geolocation: {
    watchPosition: vi.fn().mockReturnValue(3), clearWatch: vi.fn(),
  } });
  fireEvent.click(screen.getByRole("button", { name: "내 위치" }));
  const markerCount = markerPositions.length;
  fireEvent.click(screen.getByRole("link", { name: "지도 미션 상태: claimed" }));
  fireEvent.click(screen.getByRole("button", { name: "지도 보기", exact: true }));
  await act(async () => {});
  fireEvent.keyDown(window, { key: "w" });

  expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(3);
  expect(screen.queryByText(/시연 위치 ·/)).not.toBeInTheDocument();
  expect(markerPositions).toHaveLength(markerCount);
  expect(locationCount).toBe(3);
});
