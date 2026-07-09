import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/app/App";

describe("App", () => {
  it("renders starter title", () => {
    render(<App />);
    expect(screen.getByText("災害資訊整理工作台")).toBeInTheDocument();
  });

  it("keeps the home page focused on phase 0 tabs", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: "原始資訊" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "整理工作台" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "通報" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "地點" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "志工任務" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "人員指派" }),
    ).not.toBeInTheDocument();
  });

  it("opens the phase 0 workbench by default", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: "整理工作台" })).toHaveClass(
      "active",
    );
    expect(
      screen.getByText(
        "第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("學員建立草稿")).toBeInTheDocument();
  });

  it("shows review states in the phase 0 workbench", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(
      screen.getByText(
        "第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未查核").length).toBeGreaterThan(0);
  });

  it("uses distinct status classes for review and unverified records", () => {
    render(<App />);

    expect(screen.getAllByText("待人工確認")[0]).toHaveClass(
      "status-needs_review",
    );
    expect(screen.getAllByText("未查核")[0]).toHaveClass("status-unverified");
  });

  it("has draft CRUD features for Phase 0 editing", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    // Should have demo drafts pre-loaded
    expect(
      screen.getByRole("button", { name: /編輯草稿/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("示範草稿").length).toBeGreaterThan(0);
    expect(screen.getByText("學員建立草稿")).toBeInTheDocument();
    expect(screen.getByText("starter 預載範例")).toBeInTheDocument();
    expect(screen.getByText("編輯儲存後才計入")).toBeInTheDocument();

    const draftOriginChecklist = screen.getByText(
      "能分辨示範草稿與學員建立的草稿（示範 6 個，學員 0 個）",
    );
    expect(draftOriginChecklist.closest("li")).toHaveClass(
      "checklist-item--done",
    );
    expect(draftOriginChecklist.closest("li")).toHaveTextContent("已完成");
  });

  it("filters the workbench queue by review needs and blocked records", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: /全部/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /需要人工確認/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /不能直接用/ }),
    ).toBeInTheDocument();

    const needsReviewFilter = screen.getByRole("button", {
      name: /需要人工確認/,
    });
    fireEvent.click(needsReviewFilter);
    expect(needsReviewFilter).toHaveClass("active");
    expect(screen.getAllByText("M-001").length).toBeGreaterThan(0);

    const blockedFilter = screen.getByRole("button", { name: /不能直接用/ });
    fireEvent.click(blockedFilter);
    expect(blockedFilter).toHaveClass("active");
    expect(screen.queryByText("M-010")).not.toBeInTheDocument();
    expect(screen.getAllByText(/阻礙 \d+ 項/).length).toBeGreaterThan(0);
  });

  it("shows a blocker summary on the judgement card", () => {
    render(<App />);

    const riskSummary = screen.getByLabelText("草稿阻礙摘要");

    expect(riskSummary).toHaveTextContent("阻礙");
    expect(riskSummary).toHaveTextContent("3 項");
    expect(riskSummary).toHaveTextContent("直接行動");
    expect(riskSummary).toHaveTextContent("不可直接行動");
    expect(riskSummary).toHaveTextContent("人工筆記");
    expect(riskSummary).toHaveTextContent("有紀錄");
  });

  it("marks an edited demo draft as a student draft", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));
    fireEvent.click(screen.getByRole("button", { name: "編輯草稿" }));
    fireEvent.click(screen.getByRole("button", { name: "儲存草稿" }));

    expect(screen.getByText("學員建立的草稿")).toBeInTheDocument();
    expect(
      screen.getByText(
        "能分辨示範草稿與學員建立的草稿（示範 5 個，學員 1 個）",
      ),
    ).toBeInTheDocument();
  });

  it("updates the Phase 0 checklist when drafts change", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(
      screen.getByText("已建立 6 個可編輯草稿（需 6 個）"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "至少標示 3 個「為什麼不能直接變成任務」（已完成 3 個）",
      ),
    ).toBeInTheDocument();
    const observationChecklist = screen.getByText(
      "已把資料品質問題寫進 observations，並記錄 agent 哪裡不能直接相信",
    );
    expect(observationChecklist.closest("li")).toHaveClass(
      "checklist-item--done",
    );
    expect(observationChecklist.closest("li")).toHaveTextContent("已完成");

    fireEvent.click(screen.getByRole("button", { name: "刪除草稿" }));

    expect(
      screen.getByText("已建立 5 個可編輯草稿（需 6 個）"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "至少標示 3 個「為什麼不能直接變成任務」（已完成 2 個）",
      ),
    ).toBeInTheDocument();
  });
});
