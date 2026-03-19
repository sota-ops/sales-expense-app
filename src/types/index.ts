// ══════════════════════════════════════════════════
// 列挙型
// ══════════════════════════════════════════════════

export const ACTIVITY_TYPES = [
  "NEW_SALES_VISIT",
  "FOLLOW_UP_VISIT",
  "CEO_APPROVED_ACTIVITY",
  "LUNCH_MEETING",
  "DINNER_MEETING",
  "NETWORKING_EVENT",
  "MATCHING_EVENT",
  "OTHER",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const EXPENSE_TYPES = [
  "TRAVEL_EXPENSE",
  "SALES_ALLOWANCE",
  "ENTERTAINMENT_ALLOWANCE",
  "GENERAL_EXPENSE",
] as const;
export type ExpenseType = (typeof EXPENSE_TYPES)[number];

export const EXPENSE_STATUS = [
  "DRAFT",
  "SUBMITTED",
  "WAITING_MANAGER_APPROVAL",
  "WAITING_ACCOUNTING_APPROVAL",
  "WAITING_CEO_APPROVAL",
  "APPROVED",
  "REJECTED",
  "RETURNED",
  "CANCELED",
] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUS)[number];

export const ITEM_TYPES = [
  "TRAIN",
  "BUS",
  "TAXI",
  "CAR_MILEAGE",
  "HIGHWAY",
  "PARKING",
  "HOTEL",
  "SALES_DAILY_ALLOWANCE",
  "ENTERTAINMENT_ACTIVITY_ALLOWANCE",
  "GENERAL",
] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const RULE_CHECK_STATUS = ["OK", "WARNING", "VIOLATION", "NEED_EXCEPTION"] as const;
export type RuleCheckStatus = (typeof RULE_CHECK_STATUS)[number];

export const GPS_SOURCE_TYPES = [
  "VISIT_START",
  "VISIT_END",
  "MANUAL_CAPTURE",
  "BACKGROUND_CAPTURE",
] as const;
export type GpsSourceType = (typeof GPS_SOURCE_TYPES)[number];

export const EVIDENCE_STATUS = ["SUFFICIENT", "PARTIAL", "INSUFFICIENT"] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUS)[number];

export const DESTINATION_MATCH_STATUS = ["MATCH", "NEAR", "FAR", "NO_GEO"] as const;
export type DestinationMatchStatus = (typeof DESTINATION_MATCH_STATUS)[number];

export const APPROVAL_ACTION_TYPES = [
  "SUBMIT",
  "APPROVE",
  "RETURN",
  "REJECT",
  "EXCEPTION_APPROVE",
  "CANCEL",
] as const;
export type ApprovalActionType = (typeof APPROVAL_ACTION_TYPES)[number];

export const ALERT_LEVELS = ["INFO", "WARNING", "CRITICAL"] as const;
export type AlertLevel = (typeof ALERT_LEVELS)[number];

export const ALERT_CODES = [
  "SAME_DAY_ALLOWANCE_DUPLICATE",
  "MISSING_REQUIRED_EVIDENCE",
  "PHOTO_LOCATION_MISMATCH",
  "GPS_MISMATCH",
  "OVER_LIMIT",
  "INTERNAL_ONLY_NOT_ALLOWED",
  "RECEIPT_REQUIRED",
  "RECEIPT_DUPLICATE_SUSPECTED",
  "EXPENSE_RULE_VIOLATION",
  "CEO_RECOGNITION_REQUIRED",
] as const;
export type AlertCode = (typeof ALERT_CODES)[number];

export const ROLE_CODES = [
  "GENERAL_EMPLOYEE",
  "MANAGER",
  "CEO",
  "APPROVER_MANAGER",
  "APPROVER_ACCOUNTING",
  "ADMIN",
] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export const POSITION_CODES = ["CEO", "DIRECTOR", "GENERAL"] as const;
export type PositionCode = (typeof POSITION_CODES)[number];

export const TAX_TREATMENT_TYPES = ["WELFARE", "ENTERTAINMENT", "SALARY_RISK", "OTHER"] as const;
export type TaxTreatmentType = (typeof TAX_TREATMENT_TYPES)[number];

// ══════════════════════════════════════════════════
// 日当候補ステータス
// ══════════════════════════════════════════════════

export const ALLOWANCE_CANDIDATE_STATUS = [
  "AUTO_ELIGIBLE",
  "MISSING_EVIDENCE",
  "DUPLICATED_SAME_DAY",
  "NEED_CEO_APPROVAL",
  "READY_TO_APPLY",
  "REJECTED_BY_RULE",
] as const;
export type AllowanceCandidateStatus = (typeof ALLOWANCE_CANDIDATE_STATUS)[number];

// ══════════════════════════════════════════════════
// ユーティリティ型
// ══════════════════════════════════════════════════

export type GeoLocation = {
  latitude: number;
  longitude: number;
};

export type PhotoExifData = {
  takenAt: Date | null;
  latitude: number | null;
  longitude: number | null;
  geolocationExists: boolean;
  deviceMake: string | null;
  deviceModel: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  orientation: number | null;
  timezoneInfo: string | null;
};

export type EvidenceCheckResult = {
  reportPresent: boolean;
  photoPresent: boolean;
  exifPresent: boolean;
  gpsPresent: boolean;
  audioPresent: boolean;
  visitLogPresent: boolean;
  status: EvidenceStatus;
  score: number;
};

export type AllowanceCandidate = {
  visitLogId: string;
  activityDate: string;
  activityType: ActivityType;
  clientName: string;
  amount: number;
  status: AllowanceCandidateStatus;
  evidence: EvidenceCheckResult;
  alerts: string[];
};
