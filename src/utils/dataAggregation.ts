import { WorkItem, WorkCode } from '../types'

/**
 * データ集計ユーティリティ
 * 
 * このモジュールは、日報データを様々な観点から集計・分析する機能を提供します。
 * 
 * 主な機能:
 * - 工種別集計データの生成
 * - 規内/規外比率データの生成
 * - 総工数統計の計算
 */

// 工種別集計データの型定義
export interface WorkTypeData {
  name: string
  規内: number
  規外: number
  計: number
}

// 規内/規外比率データの型定義
export interface RatioData {
  name: string
  value: number
  color: string
}

// 工種別集計データを生成
export function aggregateByWorkType(workItems: WorkItem[], workCodes: WorkCode[]): WorkTypeData[] {
  if (workItems.length === 0) {
    return []
  }
  
  // 工事番号と小区分コードでグループ化
  const grouped = workItems.reduce((acc, item) => {
    const key = `${item.projectCode}_${item.subworkCode}`
    if (!acc[key]) {
      acc[key] = {
        projectCode: item.projectCode,
        subworkCode: item.subworkCode,
        規内: 0,
        規外: 0,
        計: 0
      }
    }
    acc[key].規内 += item.inHours
    acc[key].規外 += item.outHours
    acc[key].計 += item.totalHours
    return acc
  }, {} as Record<string, any>)

  // 工種名を取得して集計
  const workTypeMap = new Map<string, WorkTypeData>()
  
  Object.values(grouped).forEach((group: any) => {
    const workCode = workCodes.find(code => code.subworkCode === group.subworkCode)
    
    // 工種名の取得（フォールバック処理を改善）
    let workTypeName: string
    if (workCode && workCode.majorName) {
      workTypeName = workCode.majorName
    } else if (workCode && workCode.subworkName) {
      workTypeName = workCode.subworkName
    } else {
      workTypeName = `工事${group.projectCode}_${group.subworkCode}`
    }
    
    if (!workTypeMap.has(workTypeName)) {
      workTypeMap.set(workTypeName, {
        name: workTypeName,
        規内: 0,
        規外: 0,
        計: 0
      })
    }
    
    const existing = workTypeMap.get(workTypeName)!
    existing.規内 += group.規内
    existing.規外 += group.規外
    existing.計 += group.計
  })

  return Array.from(workTypeMap.values())
}

// 規内/規外比率データを生成
export function generateRatioData(workItems: WorkItem[]): RatioData[] {
  const totalInHours = workItems.reduce((sum, item) => sum + item.inHours, 0)
  const totalOutHours = workItems.reduce((sum, item) => sum + item.outHours, 0)

  return [
    { name: '規内', value: totalInHours, color: '#3B82F6' },
    { name: '規外', value: totalOutHours, color: '#EF4444' }
  ]
}

// 総工数統計を計算
export function calculateTotals(workItems: WorkItem[]) {
  const totalInHours = workItems.reduce((sum, item) => sum + item.inHours, 0)
  const totalOutHours = workItems.reduce((sum, item) => sum + item.outHours, 0)
  const totalHours = totalInHours + totalOutHours
  const overtimeRatio = totalHours > 0 ? (totalOutHours / totalHours * 100) : 0

  return {
    totalInHours,
    totalOutHours,
    totalHours,
    overtimeRatio: Number(overtimeRatio.toFixed(1))
  }
}
