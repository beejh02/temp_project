import { useEffect } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StartupProvider from "./StartupProvider";
import StartupSplash from "./StartupSplash";
import UserLayout from "./UserLayout";
import useStartup from "../hooks/useStartup";

function TaskDriver({ onReady }) {
  const { reportTask } = useStartup();
  useEffect(() => { onReady(reportTask); }, [onReady, reportTask]);
  return null;
}

function renderSplash() {
  let reportTask;
  const onComplete = vi.fn();
  const captureReporter = (report) => { reportTask = report; };
  render(
    <MemoryRouter>
      <StartupProvider>
        <TaskDriver onReady={captureReporter} />
        <StartupSplash onComplete={onComplete} />
      </StartupProvider>
    </MemoryRouter>,
  );

  return {
    onComplete,
    report: (id, status = "ready") => act(() => reportTask(id, status)),
    completeData: () => act(() => {
      ["map", "markets", "stores", "missions"].forEach((id) => reportTask(id, "ready"));
    }),
    image: screen.getByRole("img"),
    splash: screen.getByRole("region", { name: "누리고 시작 화면" }),
    progress: screen.getByRole("progressbar", { name: "누리고 로딩 진행률" }),
  };
}

async function advance(milliseconds) {
  await act(async () => { await vi.advanceTimersByTimeAsync(milliseconds); });
}

describe("StartupSplash", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("실제 준비된 단계만 진행률에 반영하고 오류를 100%로 표시하지 않는다", () => {
    const { image, progress, report } = renderSplash();
    expect(progress).toHaveAttribute("aria-valuenow", "0");
    fireEvent.load(image);
    expect(progress).toHaveAttribute("aria-valuenow", "20");
    report("map");
    expect(progress).toHaveAttribute("aria-valuenow", "40");
    report("missions", "error");
    expect(progress).toHaveAttribute("aria-valuenow", "40");
    report("markets");
    report("stores");

    expect(progress).toHaveAttribute("aria-valuenow", "80");
    expect(progress).toHaveAttribute("aria-valuetext", "5개 준비 단계 중 4개 완료");
    expect(screen.getByRole("status")).toHaveTextContent("일부 정보는 화면에서 다시 불러올 수 있어요");
    expect(screen.queryByText("탐험 준비 완료")).not.toBeInTheDocument();
  });

  it("2초가 지나도 데이터가 대기 중이면 화면과 실제 진행률을 유지한다", async () => {
    const { image, splash, progress, onComplete } = renderSplash();
    fireEvent.load(image);

    await advance(2000);

    expect(progress).toHaveAttribute("aria-valuenow", "20");
    expect(splash).not.toHaveClass("is-leaving");
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("탐험할 지도를 준비하고 있어요");
  });

  it("모든 준비가 끝나면 100%를 표시하고 약 2.15초 뒤 전환을 완료한다", async () => {
    const { image, splash, progress, onComplete, completeData } = renderSplash();
    fireEvent.load(image);
    completeData();
    expect(progress).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByRole("status")).toHaveTextContent("준비 완료! 우리 동네로 출발해요");

    await advance(1799);
    expect(splash).not.toHaveClass("is-leaving");
    expect(onComplete).not.toHaveBeenCalled();
    await advance(1);
    expect(splash).toHaveClass("is-leaving");
    await advance(349);
    expect(onComplete).not.toHaveBeenCalled();
    await advance(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("8초를 넘긴 작업은 완료로 가장하지 않고 350ms 전환 뒤 화면을 연다", async () => {
    const { image, splash, progress, onComplete } = renderSplash();
    fireEvent.load(image);

    await advance(7999);
    expect(splash).not.toHaveClass("is-leaving");
    expect(onComplete).not.toHaveBeenCalled();
    await advance(1);
    expect(splash).toHaveClass("is-leaving");
    expect(progress).toHaveAttribute("aria-valuenow", "20");
    expect(screen.getByRole("status")).toHaveTextContent("조금 늦어지고 있어요. 먼저 화면을 열게요");
    await advance(349);
    expect(onComplete).not.toHaveBeenCalled();
    await advance(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(progress).toHaveAttribute("aria-valuenow", "20");
  });

  it("데이터가 늦게 도착하면 100%를 500ms 보여준 다음 전환한다", async () => {
    const { image, splash, progress, onComplete, completeData } = renderSplash();
    fireEvent.load(image);
    await advance(2500);
    completeData();
    expect(progress).toHaveAttribute("aria-valuenow", "100");
    expect(splash).not.toHaveClass("is-leaving");

    await advance(499);
    expect(splash).not.toHaveClass("is-leaving");
    expect(onComplete).not.toHaveBeenCalled();
    await advance(1);
    expect(splash).toHaveClass("is-leaving");
    await advance(350);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("이미지 로드 실패도 종료 가능한 상태로 처리해 로딩 화면에 갇히지 않는다", async () => {
    const { image, progress, onComplete, completeData } = renderSplash();
    fireEvent.error(image);
    completeData();
    expect(progress).toHaveAttribute("aria-valuenow", "80");

    await advance(1800);
    await advance(350);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("일부 정보는 화면에서 다시 불러올 수 있어요");
  });

  it("처음 로딩이 끝난 뒤 메뉴를 이동해도 다시 표시하지 않는다", async () => {
    let reportTask;
    const captureReporter = (report) => { reportTask = report; };
    render(
      <MemoryRouter>
        <Routes>
          <Route element={(
            <StartupProvider>
              <TaskDriver onReady={captureReporter} />
              <UserLayout />
            </StartupProvider>
          )}>
            <Route path="/" element={<h2>지도 본문</h2>} />
            <Route path="/missions" element={<h2>미션 본문</h2>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    const userLayout = screen.getByText("지도 본문").closest(".user-layout");
    expect(userLayout).toHaveAttribute("inert");
    expect(userLayout).toHaveAttribute("aria-hidden", "true");
    fireEvent.load(screen.getByRole("img"));
    act(() => {
      ["map", "markets", "stores", "missions"].forEach((id) => reportTask(id, "ready"));
    });
    await advance(1800);
    await advance(350);

    expect(screen.queryByRole("region", { name: "누리고 시작 화면" })).not.toBeInTheDocument();
    expect(userLayout).not.toHaveAttribute("inert");
    expect(userLayout).not.toHaveAttribute("aria-hidden");
    fireEvent.click(screen.getByRole("link", { name: "미션" }));
    expect(screen.getByRole("heading", { name: "미션 본문" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "지도" }));
    expect(screen.getByRole("heading", { name: "지도 본문" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "누리고 시작 화면" })).not.toBeInTheDocument();
  });
});
