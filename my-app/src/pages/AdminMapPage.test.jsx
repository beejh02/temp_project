import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AdminMapPage from "./AdminMapPage";

vi.mock("../components/NaverMap", () => ({
  default: () => <div data-testid="naver-map" />,
}));

describe("AdminMapPage", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 3,
          name: "대전중앙시장",
          boundary: {
            type: "Polygon",
            coordinates: [[
              [127.43, 36.32],
              [127.44, 36.32],
              [127.44, 36.33],
              [127.43, 36.32],
            ]],
          },
        },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("미션 Provider 없이 관리자 위치 기능을 렌더링한다", async () => {
    render(<AdminMapPage />);

    expect(screen.getByTestId("naver-map")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "내 위치" }))
      .toBeInTheDocument();
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
  });

  it("저장된 시장을 선택해 이름과 편집 정점을 불러온다", async () => {
    render(<AdminMapPage />);

    const selector = await screen.findByLabelText("관리할 시장");

    fireEvent.change(selector, { target: { value: "3" } });

    expect(screen.getByLabelText("시장 이름"))
      .toHaveValue("대전중앙시장");
    expect(screen.getByText("선택 시장 수정 · 정점 3개"))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "수정" }))
      .toBeEnabled();
    expect(screen.getByRole("button", { name: "삭제" }))
      .toBeEnabled();
  });
});
