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

it("시연 시작과 WASD 이동을 API에 보내고 서버 완료 응답 이후 보상을 수령한다", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-05T12:00:00Z"));
  window.naver = { maps: {
    LatLng: class { constructor(lat, lng) { this.lat = lat; this.lng = lng; } },
    Marker: class { setPosition() {} setMap() {} },
  } };
  const completed = { ...demoMission, status: "completed",
    progress: { current: 1, target: 1, label: "방문 완료" } };
  const response = (body) => ({ ok: true, json: async () => body });
  let resolveCompletion;
  let locationCount = 0;
  const fetchMock = vi.fn(async (url) => {
    if (url === "/api/missions/daily") return response([demoMission]);
    if (url === "/api/markets") return response([demoMarket]);
    if (url.startsWith("/api/markets/location?")) return response([]);
    if (url === "/api/missions/27/claim") return response({ ...completed, status: "claimed" });
    if (url === "/api/missions/location") {
      locationCount += 1;
      if (locationCount === 1) return response([demoMission]);
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

  await act(async () => { resolveCompletion(response([completed])); });
  fireEvent.click(screen.getByRole("link", { name: "지도 미션 상태: completed" }));
  fireEvent.click(screen.getByRole("button", { name: /보상/ }));
  await act(async () => {});
  expect(screen.getByText("5 NP를 받았어요!")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/missions/27/claim",
    expect.objectContaining({ method: "POST", credentials: "include" }));
});
