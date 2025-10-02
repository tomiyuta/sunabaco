import React from 'react'
import { AppError, ErrorContext, ValidationResult } from '../types'

// エラーコードの定義
export const ERROR_CODES = {
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  EXCEL_PARSE_ERROR: 'EXCEL_PARSE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

// エラーメッセージの定義
export const ERROR_MESSAGES = {
  [ERROR_CODES.FILE_READ_ERROR]: 'ファイルの読み込みに失敗しました',
  [ERROR_CODES.EXCEL_PARSE_ERROR]: 'Excelファイルの解析に失敗しました',
  [ERROR_CODES.VALIDATION_ERROR]: 'データの検証に失敗しました',
  [ERROR_CODES.NETWORK_ERROR]: 'ネットワークエラーが発生しました',
  [ERROR_CODES.UNKNOWN_ERROR]: '不明なエラーが発生しました'
} as const

// エラーオブジェクトを作成
export function createError(
  code: keyof typeof ERROR_CODES,
  message?: string,
  details?: any,
  context?: ErrorContext
): AppError {
  return {
    code,
    message: message || ERROR_MESSAGES[code],
    details,
    timestamp: new Date().toISOString()
  }
}

// エラーログを出力
export function logError(error: AppError, context?: ErrorContext): void {
  const logData = {
    error,
    context,
    timestamp: new Date().toISOString()
  }
  
  console.error('Application Error:', logData)
  
  // 本番環境では外部ログサービスに送信
  if (process.env.NODE_ENV === 'production') {
    // TODO: 外部ログサービスへの送信を実装
  }
}

// ユーザーフレンドリーなエラーメッセージを生成
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.code) {
    case ERROR_CODES.FILE_READ_ERROR:
      return 'ファイルを読み込めませんでした。ファイルが破損していないか確認してください。'
    case ERROR_CODES.EXCEL_PARSE_ERROR:
      return 'Excelファイルの形式が正しくありません。正しい形式のファイルをアップロードしてください。'
    case ERROR_CODES.VALIDATION_ERROR:
      return 'データに問題があります。入力内容を確認してください。'
    case ERROR_CODES.NETWORK_ERROR:
      return 'ネットワーク接続に問題があります。接続を確認してから再試行してください。'
    default:
      return 'エラーが発生しました。しばらく時間をおいてから再試行してください。'
  }
}

// データバリデーション
export function validateWorkItem(item: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 必須フィールドのチェック
  if (!item.workDate) {
    errors.push('作業日が設定されていません')
  }
  
  if (!item.contractorName) {
    errors.push('業者名が設定されていません')
  }
  
  if (!item.projectCode) {
    errors.push('工事番号が設定されていません')
  }
  
  if (!item.subworkCode) {
    errors.push('小区分コードが設定されていません')
  }

  // 数値フィールドのチェック
  if (typeof item.inHours !== 'number' || item.inHours < 0) {
    errors.push('規内工数が正しくありません')
  }
  
  if (typeof item.outHours !== 'number' || item.outHours < 0) {
    errors.push('規外工数が正しくありません')
  }

  // 警告レベルのチェック
  if (item.inHours > 24) {
    warnings.push('規内工数が24時間を超えています')
  }
  
  if (item.outHours > 8) {
    warnings.push('規外工数が8時間を超えています')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// ファイル形式のバリデーション
export function validateFileType(file: File): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ]

  if (!allowedTypes.includes(file.type)) {
    errors.push('サポートされていないファイル形式です。Excelファイル(.xlsx, .xls)またはCSVファイルをアップロードしてください。')
  }

  // ファイルサイズのチェック（10MB制限）
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    errors.push('ファイルサイズが大きすぎます。10MB以下のファイルをアップロードしてください。')
  }

  // 警告レベルのチェック
  if (file.size > 5 * 1024 * 1024) { // 5MB
    warnings.push('ファイルサイズが大きいため、処理に時間がかかる場合があります。')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// エラーハンドリング用のHOC（Higher Order Component）
// 注意: この関数は.tsxファイルで使用してください
export function withErrorHandling<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryName: string
) {
  return function ErrorHandledComponent(props: T) {
    try {
      return React.createElement(Component, props)
    } catch (error) {
      const appError = createError(
        ERROR_CODES.UNKNOWN_ERROR,
        `Component ${errorBoundaryName} failed to render`,
        error
      )
      logError(appError, { component: errorBoundaryName, action: 'render' })
      
      return React.createElement('div', {
        className: 'p-4 bg-red-50 border border-red-200 rounded-lg'
      }, [
        React.createElement('h3', {
          className: 'text-lg font-medium text-red-800'
        }, 'エラーが発生しました'),
        React.createElement('p', {
          className: 'text-red-600'
        }, getUserFriendlyMessage(appError))
      ])
    }
  }
}
