import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/date";
import type { Phase0MessyRecord } from "./phase0-types";

const sourceTypeOrder = [
  "field_report",
  "phone_call",
  "social_post",
  "official_notice",
  "volunteer_update",
  "mock",
];

const sourceTypeLabels: Record<string, string> = {
  field_report: "現場回報",
  phone_call: "電話",
  social_post: "社群轉錄",
  official_notice: "官方公告",
  volunteer_update: "志工更新",
  mock: "模擬資料",
};

// Records with privacy concerns
const privacySensitiveRecords = new Set(["M-011", "M-012"]);

const privacyWarnings: Record<string, string> = {
  "M-011": "⚠️ 涉及個人位置與年長者隱私",
  "M-012": "⚠️ 涉及患者隱私與個人健康資訊",
};

export function Phase0RawInfoPanel({
  records,
  selectedRecordId,
  onSelect,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
}) {
  // Group records by sourceType
  const groupedBySource = new Map<string, Phase0MessyRecord[]>();

  records.forEach((record) => {
    if (!groupedBySource.has(record.sourceType)) {
      groupedBySource.set(record.sourceType, []);
    }
    groupedBySource.get(record.sourceType)!.push(record);
  });

  const orderedSources = sourceTypeOrder.filter((type) =>
    groupedBySource.has(type),
  );

  return (
    <div className="phase0-raw">
      <div className="panel__header">
        <div>
          <h2>原始資訊</h2>
          <p>這些還不是整理後資料，不能直接當成行動依據。</p>
        </div>
        <p>{records.length} 筆資料</p>
      </div>

      <div className="kanban-board">
        {orderedSources.map((sourceType) => {
          const sourceRecords = groupedBySource.get(sourceType) || [];
          return (
            <div
              key={sourceType}
              className={`kanban-column source-${sourceType}`}
            >
              <div className="kanban-column__header">
                <h3>{sourceTypeLabels[sourceType]}</h3>
                <span className="count">{sourceRecords.length}</span>
              </div>

              <div className="kanban-cards">
                {sourceRecords.map((record) => {
                  const isPrivacySensitive = privacySensitiveRecords.has(
                    record.id,
                  );
                  return (
                    <article
                      className={`record-card kanban-card ${record.id === selectedRecordId ? "record-card--selected" : ""} ${isPrivacySensitive ? "card--privacy-alert" : ""}`}
                      key={record.id}
                    >
                      <div className="record-card__header">
                        <h4>{record.id}</h4>
                        <StatusBadge status={record.verificationStatus} />
                      </div>
                      {isPrivacySensitive && (
                        <div className="privacy-warning-banner">
                          {privacyWarnings[record.id]}
                        </div>
                      )}
                      <p>{record.rawText}</p>
                      <div className="record-card__meta">
                        <span>更新：{formatDateTime(record.updatedAt)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelect(record.id)}
                        className="btn-select"
                      >
                        整理 →
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
