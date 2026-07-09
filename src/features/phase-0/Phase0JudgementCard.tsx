import { StatusBadge } from "../../components/StatusBadge";
import type { Phase0JudgementDraft, Phase0MessyRecord } from "./phase0-types";

export type DraftOrigin = "demo" | "student" | null;

const kindLabels: Record<Phase0JudgementDraft["possibleKind"], string> = {
  help_request_candidate: "求助候選",
  site_status_candidate: "地點狀態候選",
  task_candidate: "任務候選",
  assignment_candidate: "人員指派候選",
  announcement_candidate: "公告候選",
  unknown: "候選類型待判斷",
};

const confidenceLabels: Record<Phase0JudgementDraft["confidence"], string> = {
  low: "低",
  medium: "中",
  high: "高",
};

const nextStepLabels: Record<
  Phase0JudgementDraft["suggestedNextStep"],
  string
> = {
  keep_raw: "先保留原始資訊",
  ask_for_more_info: "補問來源或現場資訊",
  send_to_human_review: "交給人工確認",
  create_candidate_report: "建立候選通報",
  create_site_update_suggestion: "建立地點更新建議",
  do_not_use_yet: "暫時不要使用",
};

// Records with privacy concerns
const privacySensitiveRecords = new Set(["M-011", "M-012"]);

const privacyWarnings: Record<string, string> = {
  "M-011": "⚠️ 涉及個人位置與年長者隱私",
  "M-012": "⚠️ 涉及患者隱私與個人健康資訊",
};

export function Phase0JudgementCard({
  judgement,
  record,
  hasDraft,
  draftOrigin,
}: {
  judgement: Phase0JudgementDraft;
  record: Phase0MessyRecord;
  hasDraft: boolean;
  draftOrigin: DraftOrigin;
}) {
  const isPrivacySensitive = privacySensitiveRecords.has(record.id);
  const sourceLabel =
    draftOrigin === "student"
      ? "學員建立的草稿"
      : draftOrigin === "demo"
        ? "示範草稿"
        : "Starter 安全預設";
  const title =
    draftOrigin === "student"
      ? "已建立學員草稿"
      : draftOrigin === "demo"
        ? "已載入示範草稿"
        : "尚未建立整理草稿";
  const description = hasDraft
    ? draftOrigin === "demo"
      ? "這張卡是 starter 預載的示範草稿，用來展示整理方式，仍然不是已確認資料。學員可以編輯後儲存成自己的草稿。"
      : "這張卡顯示目前由學員建立或修正的整理草稿，仍然不是已確認資料。請保留人類檢查，避免把候選判斷當成正式行動依據。"
    : "這張卡只保留保守的安全邊界，不是 agent 對這筆資料的整理答案。請建立整理草稿，記錄可以看出的資訊與還不能判斷的地方。";
  const evidenceTitle = hasDraft ? "目前整理依據" : "目前只有安全預設";

  return (
    <article
      className={`judgement-card ${isPrivacySensitive ? "card--privacy-alert" : ""}`}
    >
      <div className="judgement-card__header">
        <div>
          <p className="eyebrow">{sourceLabel}</p>
          <h3>{title}</h3>
        </div>
        <StatusBadge status={record.verificationStatus} />
      </div>

      {isPrivacySensitive && (
        <div className="privacy-warning-banner">
          {privacyWarnings[record.id]}
        </div>
      )}

      <p>{description}</p>

      <dl className="judgement-summary">
        <div>
          <dt>候選類型</dt>
          <dd>{kindLabels[judgement.possibleKind]}</dd>
        </div>
        <div>
          <dt>信心程度</dt>
          <dd>{confidenceLabels[judgement.confidence]}</dd>
        </div>
        <div>
          <dt>下一步</dt>
          <dd>{nextStepLabels[judgement.suggestedNextStep]}</dd>
        </div>
      </dl>

      <p>
        能否直接行動：
        <strong>
          {judgement.unsafeToActDirectly ? "不可直接行動" : "仍需確認情境"}
        </strong>
      </p>

      <section className="blockers-section">
        <h4>⚠️ 為什麼現在還不能直接用</h4>
        {judgement.blockers.length > 0 ? (
          <ul className="blockers-list">
            {judgement.blockers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="no-blockers">（目前沒有發現阻礙，但仍需確認情境）</p>
        )}
      </section>

      <section>
        <h4>{evidenceTitle}</h4>
        <ul>
          {judgement.evidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
