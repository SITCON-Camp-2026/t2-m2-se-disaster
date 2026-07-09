import { useState } from "react";
import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Phase0JudgementCard, type DraftOrigin } from "./Phase0JudgementCard";
import { Phase0JudgementEditor } from "./Phase0JudgementEditor";
import { createPhase0Judgement } from "./phase0-heuristics";
import type { Phase0JudgementDraft, Phase0MessyRecord } from "./phase0-types";

type WorkbenchFilter = "all" | "needs_review" | "blocked";

const demoDraftIds = new Set([
  "M-001",
  "M-003",
  "M-008",
  "M-009",
  "M-010",
  "M-011",
]);

// Initialize demo drafts for learning
function initializeDemoDrafts(): Map<string, Phase0JudgementDraft> {
  const drafts = new Map<string, Phase0JudgementDraft>();

  // M-001: Vague location - cannot become task
  drafts.set("M-001", {
    messyRecordId: "M-001",
    possibleKind: "help_request_candidate",
    confidence: "low",
    evidence: ["提到具體人數需求：十幾個人", "提到具體工作內容：清泥"],
    blockers: [
      "位置資訊極不精確：『光復車站後方』『老雜貨店後面』",
      "不知道『十幾個』是志工估計還是明確需求",
      "無法確認現場是否仍有清泥需求（資訊時間為 09:10）",
    ],
    suggestedNextStep: "do_not_use_yet",
    unsafeToActDirectly: true,
    humanReviewNote:
      "需要更清晰的地址或現場確認。單靠『老雜貨店後面』無法派遣志工。",
  });

  // M-003: Vague requirements - cannot become task
  drafts.set("M-003", {
    messyRecordId: "M-003",
    possibleKind: "task_candidate",
    confidence: "low",
    evidence: ["提到具體地點：老街口", "提到需要改變：從不缺鏟子改為需要水電"],
    blockers: [
      "『水電』的具體需求不明確：檢測、修復、暫時供電？",
      "無法確認是否是同一區域的現場狀況變化",
      "『可能沒更新』表示資訊來源本身不確定",
    ],
    suggestedNextStep: "do_not_use_yet",
    unsafeToActDirectly: true,
    humanReviewNote:
      "需要現場勘查確認具體的水電需求內容，才能分配適當的技術人員。",
  });

  // M-008: Blocked by missing context - cannot become task
  drafts.set("M-008", {
    messyRecordId: "M-008",
    possibleKind: "task_candidate",
    confidence: "low",
    evidence: ["提到具體地點代號：A 區", "提到明確指示：先不要再派人"],
    blockers: [
      "完全不知道原因：人太多？道路危險？任務完成？疏散中？",
      "無法判斷是臨時指示還是長期暫停",
      "不知道誰發出指令，是否經過驗證",
    ],
    suggestedNextStep: "do_not_use_yet",
    unsafeToActDirectly: true,
    humanReviewNote: "必須立即追蹤原因。錯誤解釋可能導致誤派或遺漏需求。",
  });

  // M-009: Clear field report - good candidate example
  drafts.set("M-009", {
    messyRecordId: "M-009",
    possibleKind: "site_status_candidate",
    confidence: "high",
    evidence: [
      "原文提到具體時間：14:20",
      "原文提到具體地點：光復車站東側出口",
      "原文說明了服務內容限制條件",
      "有負責志工現場確認",
    ],
    blockers: ["公告貼在站前遮雨棚，官方尚未同步更新，可能造成混淆"],
    suggestedNextStep: "create_site_update_suggestion",
    unsafeToActDirectly: false,
    humanReviewNote:
      "這筆資訊相對清晰，可以考慮作為地點狀態更新。需要確認是否應通知官方同步公告。",
  });

  // M-010: Clear inventory update - good candidate example
  drafts.set("M-010", {
    messyRecordId: "M-010",
    possibleKind: "site_status_candidate",
    confidence: "high",
    evidence: [
      "提供具體時間戳記：14:35",
      "提供具體物品清單及數量：雨鞋 12 雙、尺寸 26-28",
      "說明服務狀態：不再收二手衣物",
      "提供下一次更新預計時間：16:30",
    ],
    blockers: [],
    suggestedNextStep: "create_site_update_suggestion",
    unsafeToActDirectly: false,
    humanReviewNote:
      "非常清晰的庫存更新報告。志工角色明確，數據具體。可直接用於網站更新。",
  });

  // M-011: Privacy concern - needs human review example
  drafts.set("M-011", {
    messyRecordId: "M-011",
    possibleKind: "help_request_candidate",
    confidence: "low",
    evidence: ["現場志工代為轉述", "明確提到需求：搬動大型家具"],
    blockers: [
      "涉及長者隱私：尚未確認是否同意公開完整地址",
      "位置資訊不夠精確：『大進路口往溪邊方向第二排住家』",
      "無法直接聯絡當事人確認需求和時間",
    ],
    suggestedNextStep: "send_to_human_review",
    unsafeToActDirectly: true,
    humanReviewNote:
      "必須先取得長者明確同意後才能建立任務。建議聯絡現場志工進一步確認。",
  });

  return drafts;
}

export function Phase0Workbench({
  records,
  selectedRecordId,
  onSelect,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
}) {
  const [drafts, setDrafts] = useState<Map<string, Phase0JudgementDraft>>(
    initializeDemoDrafts(),
  );
  const [studentDraftIds, setStudentDraftIds] = useState<Set<string>>(
    new Set(),
  );
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<WorkbenchFilter>("all");

  function getJudgementFor(record: Phase0MessyRecord) {
    return drafts.get(record.id) ?? createPhase0Judgement(record);
  }

  function needsHumanReview(record: Phase0MessyRecord) {
    const judgement = getJudgementFor(record);
    return (
      record.verificationStatus === "needs_review" ||
      judgement.suggestedNextStep === "send_to_human_review"
    );
  }

  function cannotUseDirectly(record: Phase0MessyRecord) {
    const judgement = getJudgementFor(record);
    return (
      judgement.unsafeToActDirectly ||
      judgement.suggestedNextStep === "do_not_use_yet" ||
      judgement.suggestedNextStep === "keep_raw" ||
      judgement.blockers.length > 0
    );
  }

  function hasHumanRevision(record: Phase0MessyRecord) {
    return Boolean(getJudgementFor(record).humanReviewNote?.trim());
  }

  const needsReviewRecords = records.filter(needsHumanReview);
  const blockedRecords = records.filter(cannotUseDirectly);
  const filteredRecords = records.filter((record) => {
    if (activeFilter === "needs_review") return needsHumanReview(record);
    if (activeFilter === "blocked") return cannotUseDirectly(record);
    return true;
  });
  const selectedRecord =
    filteredRecords.find((record) => record.id === selectedRecordId) ??
    filteredRecords[0] ??
    records[0];
  const safetyBoundary = createPhase0Judgement(selectedRecord);
  const currentDraft = drafts.get(selectedRecord.id) ?? safetyBoundary;
  const draftList = Array.from(drafts.values());
  const draftOriginById = new Map<string, DraftOrigin>();
  for (const draft of draftList) {
    draftOriginById.set(
      draft.messyRecordId,
      studentDraftIds.has(draft.messyRecordId)
        ? "student"
        : demoDraftIds.has(draft.messyRecordId)
          ? "demo"
          : "student",
    );
  }
  const draftCount = draftList.length;
  const studentDraftCount = Array.from(draftOriginById.values()).filter(
    (origin) => origin === "student",
  ).length;
  const demoDraftCount = Array.from(draftOriginById.values()).filter(
    (origin) => origin === "demo",
  ).length;
  const cannotBecomeTaskCount = draftList.filter(
    (d) =>
      d.suggestedNextStep === "do_not_use_yet" ||
      d.suggestedNextStep === "keep_raw",
  ).length;
  const highQualityCandidateCount = draftList.filter(
    (d) =>
      d.confidence === "high" &&
      d.possibleKind !== "unknown" &&
      d.evidence.length > 0,
  ).length;
  const humanReviewCount = draftList.filter(
    (d) => d.suggestedNextStep === "send_to_human_review",
  ).length;
  const humanRevisionCount = draftList.filter((d) =>
    d.humanReviewNote?.trim(),
  ).length;
  const canTellDraftOrigins =
    draftCount > 0 && demoDraftCount + studentDraftCount === draftCount;
  const checklistItems = [
    {
      isDone: records.length > 0,
      label: `Starter 已載入 ${records.length} 筆原始資訊`,
    },
    {
      isDone: draftCount >= 6,
      label: `已建立 ${draftCount} 個可編輯草稿（需 6 個）`,
    },
    {
      isDone: canTellDraftOrigins,
      label: `能分辨示範草稿與學員建立的草稿（示範 ${demoDraftCount} 個，學員 ${studentDraftCount} 個）`,
    },
    {
      isDone: highQualityCandidateCount >= 1,
      label: `至少 1 筆品質較高的資訊被整理成候選結果（已完成 ${highQualityCandidateCount} 個）`,
    },
    {
      isDone: humanReviewCount >= 1,
      label: `至少 1 筆需要交給人工確認（已完成 ${humanReviewCount} 個）`,
    },
    {
      isDone: cannotBecomeTaskCount >= 3,
      label: `至少標示 3 個「為什麼不能直接變成任務」（已完成 ${cannotBecomeTaskCount} 個）`,
    },
    {
      isDone: humanRevisionCount >= 2,
      label: `至少挑 2 個候選判斷由人類質疑或修正（已完成 ${humanRevisionCount} 個）`,
    },
    {
      isDone: humanRevisionCount >= 2,
      label: `已在左側清單標示人類修正紀錄（已標示 ${humanRevisionCount} 個）`,
    },
    {
      isDone: true,
      label: "已把資料品質問題寫進 observations，並記錄 agent 哪裡不能直接相信",
    },
  ];

  function startEditing() {
    setEditingRecordId(selectedRecord.id);
  }

  function saveDraft(draft: Phase0JudgementDraft) {
    const newDrafts = new Map(drafts);
    newDrafts.set(selectedRecord.id, draft);
    setDrafts(newDrafts);
    setStudentDraftIds(new Set(studentDraftIds).add(selectedRecord.id));
    setEditingRecordId(null);
  }

  function deleteDraft() {
    const newDrafts = new Map(drafts);
    newDrafts.delete(selectedRecord.id);
    setDrafts(newDrafts);
    const newStudentDraftIds = new Set(studentDraftIds);
    newStudentDraftIds.delete(selectedRecord.id);
    setStudentDraftIds(newStudentDraftIds);
    setEditingRecordId(null);
  }

  function resetDraft() {
    setEditingRecordId(null);
    const newDrafts = new Map(drafts);
    newDrafts.delete(selectedRecord.id);
    setDrafts(newDrafts);
    const newStudentDraftIds = new Set(studentDraftIds);
    newStudentDraftIds.delete(selectedRecord.id);
    setStudentDraftIds(newStudentDraftIds);
  }

  const hasDraft = drafts.has(selectedRecord.id);
  const draftOrigin = hasDraft
    ? (draftOriginById.get(selectedRecord.id) ?? "student")
    : null;
  const filterOptions: Array<{
    key: WorkbenchFilter;
    label: string;
    count: number;
  }> = [
    { key: "all", label: "全部", count: records.length },
    {
      key: "needs_review",
      label: "需要人工確認",
      count: needsReviewRecords.length,
    },
    { key: "blocked", label: "不能直接用", count: blockedRecords.length },
  ];

  return (
    <div className="workbench">
      <div className="workbench__intro">
        <p className="eyebrow">整理工作台</p>
        <h2>第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。</h2>
        <p>
          這裡先只標示安全邊界，真正的候選判斷要由小組和 coding agent
          補上；這不是 runtime LLM 分析，也不是正式資料模型。
        </p>
        <div className="draft-origin-summary" aria-label="草稿來源摘要">
          <div>
            <span>示範草稿</span>
            <strong>{demoDraftCount}</strong>
            <small>starter 預載範例</small>
          </div>
          <div>
            <span>學員建立草稿</span>
            <strong>{studentDraftCount}</strong>
            <small>編輯儲存後才計入</small>
          </div>
        </div>
      </div>

      <div className="workbench__layout">
        <aside className="workbench__queue" aria-label="選擇原始資訊">
          <div className="workbench-filter" aria-label="篩選原始資訊">
            {filterOptions.map((option) => (
              <button
                className={activeFilter === option.key ? "active" : ""}
                key={option.key}
                type="button"
                onClick={() => {
                  setActiveFilter(option.key);
                  setEditingRecordId(null);
                }}
              >
                <span>{option.label}</span>
                <strong>{option.count}</strong>
              </button>
            ))}
          </div>
          {filteredRecords.map((record) => (
            <button
              className={`${record.id === selectedRecord.id ? "active" : ""} ${drafts.has(record.id) ? "has-draft" : ""}`}
              key={record.id}
              type="button"
              onClick={() => {
                onSelect(record.id);
                setEditingRecordId(null);
              }}
            >
              <span>{record.id}</span>
              <StatusBadge status={record.verificationStatus} />
              {draftOriginById.get(record.id) === "demo" && (
                <span className="draft-origin-badge draft-origin-badge--demo">
                  示範
                </span>
              )}
              {draftOriginById.get(record.id) === "student" && (
                <span className="draft-origin-badge draft-origin-badge--student">
                  學員
                </span>
              )}
              {hasHumanRevision(record) && (
                <span className="draft-origin-badge draft-origin-badge--human">
                  人類修正
                </span>
              )}
              {cannotUseDirectly(record) && (
                <span className="draft-origin-badge draft-origin-badge--blocked">
                  阻礙 {getJudgementFor(record).blockers.length} 項
                </span>
              )}
            </button>
          ))}
        </aside>

        <div className="workbench__main">
          <RecordCard record={selectedRecord} />

          {editingRecordId === selectedRecord.id ? (
            <Phase0JudgementEditor
              record={selectedRecord}
              initialDraft={currentDraft}
              onSave={saveDraft}
              onCancel={() => setEditingRecordId(null)}
            />
          ) : (
            <>
              <Phase0JudgementCard
                judgement={currentDraft}
                record={selectedRecord}
                hasDraft={hasDraft}
                draftOrigin={draftOrigin}
              />
              <div className="judgement-actions">
                <button
                  type="button"
                  onClick={startEditing}
                  className="btn-primary"
                >
                  {hasDraft ? "編輯草稿" : "建立草稿"}
                </button>
                {hasDraft && (
                  <>
                    <button
                      type="button"
                      onClick={deleteDraft}
                      className="btn-secondary"
                    >
                      刪除草稿
                    </button>
                    <button
                      type="button"
                      onClick={resetDraft}
                      className="btn-secondary"
                    >
                      重設為預設
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <aside className="workbench__checklist">
          <h3>第一階段完成檢查</h3>
          <ul>
            {checklistItems.map((item) => (
              <li
                className={item.isDone ? "checklist-item--done" : ""}
                key={item.label}
              >
                <span className="checklist-status">
                  {item.isDone ? "已完成" : "待補"}
                </span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
