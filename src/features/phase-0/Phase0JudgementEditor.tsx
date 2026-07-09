import { useState } from "react";
import type {
  Phase0JudgementDraft,
  Phase0MessyRecord,
  Phase0PossibleKind,
  Phase0Confidence,
  Phase0SuggestedNextStep,
} from "./phase0-types";

const kindOptions: Phase0PossibleKind[] = [
  "help_request_candidate",
  "site_status_candidate",
  "task_candidate",
  "assignment_candidate",
  "announcement_candidate",
  "unknown",
];

const confidenceOptions: Phase0Confidence[] = ["low", "medium", "high"];

const nextStepOptions: Phase0SuggestedNextStep[] = [
  "keep_raw",
  "ask_for_more_info",
  "send_to_human_review",
  "create_candidate_report",
  "create_site_update_suggestion",
  "do_not_use_yet",
];

const kindLabels: Record<Phase0PossibleKind, string> = {
  help_request_candidate: "求助候選",
  site_status_candidate: "地點狀態候選",
  task_candidate: "任務候選",
  assignment_candidate: "人員指派候選",
  announcement_candidate: "公告候選",
  unknown: "候選類型待判斷",
};

const confidenceLabels: Record<Phase0Confidence, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

const nextStepLabels: Record<Phase0SuggestedNextStep, string> = {
  keep_raw: "先保留原始資訊",
  ask_for_more_info: "補問來源或現場資訊",
  send_to_human_review: "交給人工確認",
  create_candidate_report: "建立候選通報",
  create_site_update_suggestion: "建立地點更新建議",
  do_not_use_yet: "暫時不要使用",
};

export function Phase0JudgementEditor({
  record,
  initialDraft,
  onSave,
  onCancel,
}: {
  record: Phase0MessyRecord;
  initialDraft: Phase0JudgementDraft;
  onSave: (draft: Phase0JudgementDraft) => void;
  onCancel: () => void;
}) {
  const [possibleKind, setPossibleKind] = useState<Phase0PossibleKind>(
    initialDraft.possibleKind,
  );
  const [confidence, setConfidence] = useState<Phase0Confidence>(
    initialDraft.confidence,
  );
  const [suggestedNextStep, setSuggestedNextStep] =
    useState<Phase0SuggestedNextStep>(initialDraft.suggestedNextStep);
  const [evidenceText, setEvidenceText] = useState(
    initialDraft.evidence.join("\n"),
  );
  const [blockersText, setBlockersText] = useState(
    initialDraft.blockers.join("\n"),
  );
  const [unsafeToActDirectly, setUnsafeToActDirectly] = useState(
    initialDraft.unsafeToActDirectly,
  );
  const [humanReviewNote, setHumanReviewNote] = useState(
    initialDraft.humanReviewNote ?? "",
  );

  function handleSave() {
    const updatedDraft: Phase0JudgementDraft = {
      messyRecordId: record.id,
      possibleKind,
      confidence,
      evidence: evidenceText
        .split("\n")
        .filter((line) => line.trim().length > 0),
      blockers: blockersText
        .split("\n")
        .filter((line) => line.trim().length > 0),
      suggestedNextStep,
      unsafeToActDirectly,
      humanReviewNote: humanReviewNote.trim() || undefined,
    };
    onSave(updatedDraft);
  }

  return (
    <form className="judgement-editor">
      <div className="editor__section">
        <label>
          <span className="label-text">候選類型</span>
          <select
            value={possibleKind}
            onChange={(e) =>
              setPossibleKind(e.target.value as Phase0PossibleKind)
            }
          >
            {kindOptions.map((kind) => (
              <option key={kind} value={kind}>
                {kindLabels[kind]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="editor__section">
        <label>
          <span className="label-text">信心程度</span>
          <select
            value={confidence}
            onChange={(e) => setConfidence(e.target.value as Phase0Confidence)}
          >
            {confidenceOptions.map((conf) => (
              <option key={conf} value={conf}>
                {confidenceLabels[conf]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="editor__section">
        <label>
          <span className="label-text">下一步建議</span>
          <select
            value={suggestedNextStep}
            onChange={(e) =>
              setSuggestedNextStep(e.target.value as Phase0SuggestedNextStep)
            }
          >
            {nextStepOptions.map((step) => (
              <option key={step} value={step}>
                {nextStepLabels[step]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="editor__section">
        <label>
          <span className="label-text">判斷依據（一行一項）</span>
          <textarea
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
            placeholder="例：原文提到具體人數&#10;例：來源為現場志工回報"
            rows={4}
          />
        </label>
      </div>

      <div className="editor__section">
        <label>
          <span className="label-text">阻礙因素（一行一項）</span>
          <textarea
            value={blockersText}
            onChange={(e) => setBlockersText(e.target.value)}
            placeholder="例：位置資訊不足&#10;例：無法確認當事人意願"
            rows={4}
          />
        </label>
      </div>

      <div className="editor__section">
        <label>
          <span className="label-text">
            <input
              type="checkbox"
              checked={unsafeToActDirectly}
              onChange={(e) => setUnsafeToActDirectly(e.target.checked)}
            />
            不能直接行動
          </span>
        </label>
      </div>

      <div className="editor__section">
        <label>
          <span className="label-text">人工確認筆記</span>
          <textarea
            value={humanReviewNote}
            onChange={(e) => setHumanReviewNote(e.target.value)}
            placeholder="記錄人類判斷、質疑或修正"
            rows={3}
          />
        </label>
      </div>

      <div className="editor__actions">
        <button type="button" onClick={handleSave} className="btn-primary">
          儲存草稿
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          取消編輯
        </button>
      </div>
    </form>
  );
}
