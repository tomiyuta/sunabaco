import * as XLSX from 'xlsx'
import { WorkItem, WorkCode } from '../types'

// テスト用の日報データを生成
export function generateTestDailyData() {
  return [
    ['日付', '業者名', '報告者名', '在籍', '雇', '工事番号', '小区画', '小区分', '規内', '規外', '計'],
    ['20250115', '㈲三和工業', '田中太郎', 5, '正社員', 'S6290', 'B12P', '211', 8.0, 1.5, 9.5],
    ['20250116', '㈲三和工業', '佐藤花子', 3, '正社員', 'S6290', 'B12P', '212', 7.5, 0.5, 8.0],
    ['20250117', '㈲三和工業', '鈴木一郎', 4, '正社員', 'S6291', 'H5P', '25K', 8.0, 2.0, 10.0],
    ['20250118', '㈲三和工業', '高橋花子', 2, '正社員', 'S6291', 'H5P', '25K', 7.0, 1.0, 8.0],
    ['20250119', '㈲三和工業', '山田太郎', 6, '正社員', 'S6292', 'C8P', '211', 8.5, 1.5, 10.0],
  ]
}

// テスト用のコードデータを生成
export function generateTestCodeData() {
  return [
    ['大区分', '大区分名称', '小区分', '小区分名称', '備考'],
    ['110', '組立', '211', '配材作業', '材料の準備作業'],
    ['110', '組立', '212', '組立作業', '部品の組み立て'],
    ['120', '配管', '25K', '配管作業', '配管の設置作業'],
    ['130', '電気', '311', '電気配線', '電気配線作業'],
    ['140', '塗装', '411', '下地処理', '塗装前の下地処理'],
  ]
}

// テスト用のWorkItemデータを生成
export function generateTestWorkItems(): WorkItem[] {
  return [
    {
      id: 'work_1',
      workDate: '2025-01-15',
      contractorId: 'contractor_㈲三和工業',
      contractorName: '㈲三和工業',
      reporter: '田中太郎',
      headcount: 5,
      employmentCode: '正社員',
      projectId: 'project_S6290',
      projectCode: 'S6290',
      subareaCode: 'B12P',
      subworkCode: '211',
      inHours: 8.0,
      outHours: 1.5,
      totalHours: 9.5,
      srcHash: 'test_hash_1',
      createdAt: '2025-01-15T00:00:00.000Z'
    },
    {
      id: 'work_2',
      workDate: '2025-01-16',
      contractorId: 'contractor_㈲三和工業',
      contractorName: '㈲三和工業',
      reporter: '佐藤花子',
      headcount: 3,
      employmentCode: '正社員',
      projectId: 'project_S6290',
      projectCode: 'S6290',
      subareaCode: 'B12P',
      subworkCode: '212',
      inHours: 7.5,
      outHours: 0.5,
      totalHours: 8.0,
      srcHash: 'test_hash_2',
      createdAt: '2025-01-16T00:00:00.000Z'
    }
  ]
}

// テスト用のWorkCodeデータを生成
export function generateTestWorkCodes(): WorkCode[] {
  return [
    {
      subworkCode: '211',
      subworkName: '配材作業',
      majorCode: '110',
      majorName: '組立',
      note: '材料の準備作業',
      version: '1.0',
      updatedAt: '2025-01-15T00:00:00.000Z'
    },
    {
      subworkCode: '212',
      subworkName: '組立作業',
      majorCode: '110',
      majorName: '組立',
      note: '部品の組み立て',
      version: '1.0',
      updatedAt: '2025-01-15T00:00:00.000Z'
    }
  ]
}

// テスト用のExcelファイルを生成（実際のtest.xlsxファイルを使用）
export function generateTestExcelFile(): File {
  // 実際のtest.xlsxファイルの内容を再現
  const wb = XLSX.utils.book_new()
  
  // 日報データシートを追加
  const dailyData = generateTestDailyData()
  const ws1 = XLSX.utils.aoa_to_sheet(dailyData)
  XLSX.utils.book_append_sheet(wb, ws1, 'データ(日報)')
  
  // コードシートを追加
  const codeData = generateTestCodeData()
  const ws2 = XLSX.utils.aoa_to_sheet(codeData)
  XLSX.utils.book_append_sheet(wb, ws2, 'コード')
  
  // バイナリデータを生成
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  
  // Fileオブジェクトを作成（test.xlsxという名前に変更）
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  return new File([blob], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// 実際のtest.xlsxファイルを読み込む関数（Node.js環境用）
export async function loadTestExcelFile(): Promise<File> {
  if (typeof window === 'undefined') {
    // Node.js環境の場合
    const fs = await import('fs')
    const path = await import('path')
    
    const filePath = path.join(process.cwd(), 'test.xlsx')
    const fileBuffer = fs.readFileSync(filePath)
    
    return new File([fileBuffer], 'test.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
  } else {
    // ブラウザ環境の場合
    return generateTestExcelFile()
  }
}

// 空のデータのExcelファイルを生成（エラーテスト用）
export function generateEmptyExcelFile(): File {
  const wb = XLSX.utils.book_new()
  
  // 空のシートを追加
  const emptyData = [['日付', '業者名', '工事番号', '小区分', '規内', '規外']]
  const ws = XLSX.utils.aoa_to_sheet(emptyData)
  XLSX.utils.book_append_sheet(wb, ws, 'データ(日報)')
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  return new File([blob], 'empty_test_data.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
