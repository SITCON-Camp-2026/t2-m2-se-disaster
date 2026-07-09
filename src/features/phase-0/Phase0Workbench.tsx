import { useState } from "react";
import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Phase0JudgementCard } from "./Phase0JudgementCard";
import { Phase0JudgementEditor } from "./Phase0JudgementEditor";
import { createPhase0Judgement } from "./phase0-heuristics";
import type { Phase0JudgementDraft, Phase0MessyRecord } from "./phase0-types";

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
    new Map(),
  );
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];
  const safetyBoundary = createPhase0Judgement(selectedRecord);
  const currentDraft = drafts.get(selectedRecord.id) ?? safetyBoundary;
  const draftCount = drafts.size;

  function startEditing() {
    setEditingRecordId(selectedRecord.id);
  }

  function saveDraft(draft: Phase0JudgementDraft) {
    const newDrafts = new Map(drafts);
    newDrafts.set(selectedRecord.id, draft);
    setDrafts(newDrafts);
    setEditingRecordId(null);
  }

  function deleteDraft() {
    const newDrafts = new Map(drafts);
    newDrafts.delete(selectedRecord.id);
    setDrafts(newDrafts);
    setEditingRecordId(null);
  }

  function resetDraft() {
    setEditingRecordId(null);
    const newDrafts = new Map(drafts);
    newDrafts.delete(selectedRecord.id);
    setDrafts(newDrafts);
  }

  const hasDraft = drafts.has(selectedRecord.id);

  return (
    <div className="workbench">
      <div className="workbench__intro">
        <p className="eyebrow">整理工作台</p>
        <h2>第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。</h2>
        <p>
          這裡先只標示安全邊界，真正的候選判斷要由小組和 coding agent
          補上；這不是 runtime LLM 分析，也不是正式資料模型。
        </p>
      </div>

      <div className="workbench__layout">
        <aside className="workbench__queue" aria-label="選擇原始資訊">
          {records.map((record) => (
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
              {drafts.has(record.id) && (
                <span className="draft-indicator">✓</span>
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
            <li>✓ Starter 已載入 {records.length} 筆原始資訊</li>
            <li>
              {draftCount >= 6 ? "✓" : "◇"} 已建立 {draftCount} 個可編輯草稿（需
              6 個）
            </li>
            <li>◇ 至少挑 2 個候選判斷由人類質疑或修正</li>
            <li>
              ◇ 把資料品質問題寫進 observations，並記錄 agent 哪裡不能直接相信
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
