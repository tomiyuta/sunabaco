import * as XLSX from 'xlsx'
import { WorkItem, WorkCode, ColumnMapping } from '../types'
import { createError, logError, ERROR_CODES, validateWorkItem } from './errorHandler'

/**
 * Excelファイル解析ユーティリティ
 * 
 * このモジュールは、Excelファイル（.xlsx, .xls）を解析して
 * 日報データとコードマスタデータを抽出する機能を提供します。
 * 
 * 主な機能:
 * - Excelファイルの読み込みと解析
 * - 列名の自動検出とマッピング
 * - データ型の変換（日付、数値、文字列）
 * - 重複チェック用のハッシュ生成
 */

// Excelファイルの列名候補（より柔軟なマッチング）
const COLUMN_CANDIDATES = {
  workDate: ['日付', '日付(YYYYMMDD|ExcelSerial|string)', 'work_date', 'date', '年月日', '作業日'],
  contractorName: ['業者名', '業者', 'contractor', 'company', '会社', '企業'],
  reporter: ['報告者名', '報告者', 'reporter', 'name', '氏名', '担当者'],
  headcount: ['在籍', '人数', 'headcount', 'count', '人員'],
  employmentCode: ['雇', '雇用区分', 'employment', 'emp_code', '雇用'],
  projectCode: ['工事番号', '工事番号(Sxxxx)', 'project', 'project_code', '工事', 'プロジェクト'],
  subareaCode: ['小区画', '小区画(code例: B12P/H5P/...)', 'subarea', 'area', '区画'],
  subworkCode: ['小区分', '小区分(code例: 25K/211/...)', 'subwork', 'work_code', '作業', '工種'],
  inHours: ['規内', '規内(numeric)', 'in_hours', 'regular', '通常', '定時'],
  outHours: ['規外', '規外(numeric)', 'out_hours', 'overtime', '残業', '超過'],
  totalHours: ['計', '計(numeric)', 'total_hours', 'total', '合計', '総計']
}

// 日付パース関数
export function parseDate(value: any): string | null {
  if (!value) return null
  
  const str = String(value).trim()
  
  // YYYYMMDD形式
  if (/^\d{8}$/.test(str)) {
    const year = str.substring(0, 4)
    const month = str.substring(4, 6)
    const day = str.substring(6, 8)
    return `${year}-${month}-${day}`
  }
  
  // Excelシリアル番号
  if (/^\d+\.?\d*$/.test(str)) {
    const serial = parseFloat(str)
    const date = new Date((serial - 25569) * 86400 * 1000)
    return date.toISOString().split('T')[0]
  }
  
  // 既存の日付形式
  const date = new Date(str)
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]
  }
  
  return null
}

// 数値パース関数
export function parseNumber(value: any): number {
  if (value === null || value === undefined || value === '') return 0
  
  // 文字列の場合は数値部分のみを抽出
  const str = String(value).trim()
  const num = parseFloat(str)
  
  if (isNaN(num)) {
    return 0
  }
  
  return num
}

// 文字列パース関数
export function parseString(value: any): string {
  return value ? String(value).trim() : ''
}

// 列名の自動検出
export function detectColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  
  // headersをフィルタリングしてnull/undefinedを除外
  const validHeaders = headers.filter(header => header && typeof header === 'string')
  
  Object.entries(COLUMN_CANDIDATES).forEach(([key, candidates]) => {
    for (const candidate of candidates) {
      const found = validHeaders.find(header => {
        const headerLower = header.toLowerCase().trim()
        const candidateLower = candidate.toLowerCase().trim()
        
        // より柔軟なマッチング
        const exactMatch = headerLower === candidateLower
        const containsMatch = headerLower.includes(candidateLower) || candidateLower.includes(headerLower)
        const partialMatch = candidateLower.split('').every(char => headerLower.includes(char))
        
        return exactMatch || containsMatch || partialMatch
      })
      if (found) {
        mapping[key] = found
        break
      }
    }
  })
  
  return mapping
}

// Excelファイルの解析
export function parseExcelFile(file: File): Promise<{
  workItems: WorkItem[]
  workCodes: WorkCode[]
  columnMapping: ColumnMapping
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // 日報データシートの解析
        const dailyDataSheet = workbook.Sheets['データ(日報)'] || workbook.Sheets[Object.keys(workbook.Sheets)[0]]
        if (!dailyDataSheet) {
          throw new Error('日報データシートが見つかりません')
        }
        
        const dailyData = XLSX.utils.sheet_to_json(dailyDataSheet, { header: 1 })
        
        // 5行目がヘッダー行（0ベースなので4）
        const headers = (dailyData[4] as any[])?.map(h => h ? String(h).trim() : '') || []
        const rows = dailyData.slice(5) as any[][]
        
        // 強制的に位置ベースマッピングを使用（解析元.xlsxの構造に基づく）
        const columnMapping: ColumnMapping = {}
        // 解析元.xlsxの実際の列順序に基づくマッピング
        if (headers[0]) columnMapping.workDate = headers[0]        // 日付
        if (headers[1]) columnMapping.contractorName = headers[1]  // 業者名
        if (headers[2]) columnMapping.reporter = headers[2]        // 報告者名
        if (headers[3]) columnMapping.headcount = headers[3]       // 在籍
        if (headers[5]) columnMapping.employmentCode = headers[5]  // 雇
        if (headers[6]) columnMapping.projectCode = headers[6]     // 工事番号
        if (headers[10]) columnMapping.subareaCode = headers[10]   // 小区画
        if (headers[11]) columnMapping.subworkCode = headers[11]   // 小区分
        if (headers[14]) columnMapping.inHours = headers[14]       // 規内
        if (headers[15]) columnMapping.outHours = headers[15]      // 規外
        if (headers[16]) columnMapping.totalHours = headers[16]    // 計
        
        const workItems: WorkItem[] = rows
          .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
          .map((row, index) => {
            const item: any = {}
            Object.entries(columnMapping).forEach(([key, columnName]) => {
              const columnIndex = headers.indexOf(columnName)
              if (columnIndex >= 0) {
                item[key] = row[columnIndex]
              }
            })
            
            const workDate = parseDate(item.workDate)
            const inHours = parseNumber(item.inHours)
            const outHours = parseNumber(item.outHours)
            const totalHours = Math.max(0, inHours + outHours)
            
            return {
              id: `work_${Date.now()}_${index}`,
              workDate: workDate || '',
              contractorId: `contractor_${parseString(item.contractorName)}`,
              contractorName: parseString(item.contractorName),
              reporter: parseString(item.reporter),
              headcount: parseNumber(item.headcount),
              employmentCode: parseString(item.employmentCode),
              projectId: `project_${parseString(item.projectCode)}`,
              projectCode: parseString(item.projectCode),
              subareaCode: parseString(item.subareaCode),
              subworkCode: parseString(item.subworkCode),
              inHours,
              outHours,
              totalHours,
              srcHash: '', // 後で計算
              createdAt: new Date().toISOString()
            }
          })
        
        // コードシートの解析
        const codesSheet = workbook.Sheets['コード']
        let workCodes: WorkCode[] = []
        
        if (codesSheet) {
          const codesData = XLSX.utils.sheet_to_json(codesSheet, { header: 1 })
          // 3行目がヘッダー行（0ベースなので2）
          const codesHeaders = (codesData[2] as any[])?.map(h => h ? String(h).trim() : '') || []
          const codesRows = codesData.slice(3) as any[][]
          
          workCodes = codesRows
            .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
            .map((row, index) => {
              const majorCodeIndex = codesHeaders.findIndex(h => h && h.includes('大区分') && !h.includes('名称'))
              const majorNameIndex = codesHeaders.findIndex(h => h && h.includes('大区分') && h.includes('名称'))
              const subworkCodeIndex = codesHeaders.findIndex(h => h && h.includes('小区分') && !h.includes('名称'))
              const subworkNameIndex = codesHeaders.findIndex(h => h && h.includes('小区分') && h.includes('名称'))
              const noteIndex = codesHeaders.findIndex(h => h && h.includes('備考'))
              
              return {
                subworkCode: parseString(row[subworkCodeIndex]),
                subworkName: parseString(row[subworkNameIndex]),
                majorCode: parseString(row[majorCodeIndex]),
                majorName: parseString(row[majorNameIndex]),
                note: noteIndex >= 0 ? parseString(row[noteIndex]) : undefined,
                version: '1.0',
                updatedAt: new Date().toISOString()
              }
            })
        }
        
        resolve({
          workItems,
          workCodes,
          columnMapping
        })
      } catch (error) {
        const appError = createError(
          ERROR_CODES.EXCEL_PARSE_ERROR,
          `Excelファイルの解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
          error
        )
        logError(appError, { component: 'excelParser', action: 'parseExcelFile' })
        reject(appError)
      }
    }
    
    reader.onerror = () => {
      const appError = createError(
        ERROR_CODES.FILE_READ_ERROR,
        'ファイルの読み込みに失敗しました'
      )
      logError(appError, { component: 'excelParser', action: 'readFile' })
      reject(appError)
    }
    reader.readAsArrayBuffer(file)
  })
}

// 重複チェック用のハッシュ生成
export function generateRowHash(item: WorkItem): string {
  const key = `${item.workDate}_${item.contractorName}_${item.projectCode}_${item.subworkCode}_${item.subareaCode}_${item.reporter}_${item.inHours}_${item.outHours}`
  
  // 日本語文字を含む文字列を安全にエンコード
  try {
    // TextEncoderを使用してUTF-8バイト配列に変換
    const encoder = new TextEncoder()
    const data = encoder.encode(key)
    
    // バイト配列をBase64エンコード
    let binary = ''
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i])
    }
    return btoa(binary).replace(/[^a-zA-Z0-9]/g, '')
  } catch (error) {
    // フォールバック: 単純なハッシュ関数を使用
    let hash = 0
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 32bit整数に変換
    }
    return Math.abs(hash).toString(36)
  }
}

