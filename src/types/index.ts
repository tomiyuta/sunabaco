// 日報データの型定義
export interface WorkItem {
  id: string
  workDate: string
  contractorId: string
  contractorName: string
  reporter: string
  headcount: number
  employmentCode: string
  projectId: string
  projectCode: string
  subareaCode: string
  subworkCode: string
  inHours: number
  outHours: number
  totalHours: number
  srcHash: string
  createdAt: string
}

// コードマスタの型定義
export interface WorkCode {
  subworkCode: string
  subworkName: string
  majorCode: string
  majorName: string
  note?: string
  version: string
  updatedAt: string
}

// プロジェクトの型定義
export interface Project {
  projectId: string
  projectCode: string
}

// 業者の型定義
export interface Contractor {
  contractorId: string
  contractorName: string
}

// 集計結果の型定義
export interface AggregateResult {
  groups: string[]
  rows: AggregateRow[]
  total: number
}

export interface AggregateRow {
  [key: string]: string | number
  規内: number
  規外: number
  計: number
  規外比率: number
}

// 取込結果の型定義
export interface ImportResult {
  jobId: string
  inserted: number
  updated: number
  duplicates: number
  errors: number
  undefinedCodes: number
}

// フィルタ条件の型定義
export interface FilterConditions {
  groupBy: string[]
  metrics: string[]
  from?: string
  to?: string
  contractor?: string
  project?: string
  employment?: string
  page: number
  pageSize: number
}

// Excelファイルの列マッピング
export interface ColumnMapping {
  [key: string]: string
}

// 未定義コードの型定義
export interface UndefinedCode {
  subworkCode: string
  count: number
  firstSeen: string
}

// エラーハンドリング用の型定義
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
}

export interface ErrorContext {
  component: string
  action: string
  data?: any
}

// バリデーション結果の型定義
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// レポートデータの型定義
export interface ReportData {
  工事番号: string
  大区分: string
  小区分: string
  規内: number
  規外: number
  計: number
  規外比率: number
}

// 時系列データの型定義
export interface TimeSeriesData {
  date: string
  規内: number
  規外: number
  計: number
}

