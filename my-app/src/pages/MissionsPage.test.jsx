import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MissionsPage from "./MissionsPage";

const { useMissionDemoMock } = vi.hoisted(() => ({
  useMissionDemoMock: vi.fn(),
}));

vi.mock("../hooks/useMissionDemo", () => ({
  default: useMissionDemoMock,
}));

describe("MissionsPage", () => {
  beforeEach(() => {
    useMissionDemoMock.mockReset();
  });

  it("백그라운드 갱신 실패 시 기존 목록과 재시도 안내를 함께 표시한다", () => {
    const refreshMissions = vi.fn();
    useMissionDemoMock.mockReturnValue({
      missions: [],
      loadStatus: "success",
      errorMessage: "미션 서버에 연결할 수 없습니다.",
      refreshMissions,
    });

    render(
      <MemoryRouter>
        <MissionsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Daily Mission" }))
      .toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "미션 서버에 연결할 수 없습니다.",
    );

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(refreshMissions).toHaveBeenCalledTimes(1);
  });
});
