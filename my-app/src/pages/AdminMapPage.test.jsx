import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AdminMapPage from "./AdminMapPage";

vi.mock("../components/NaverMap", () => ({
  default: () => <div data-testid="naver-map" />,
}));

describe("AdminMapPage", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
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
});
