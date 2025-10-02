import { createContext, useContext, useState, ReactNode } from 'react'
import { WorkItem, WorkCode } from '../types'

/**
 * データ管理コンテキスト
 * 
 * アプリケーション全体で共有される日報データとコードマスタデータを管理します。
 * 
 * 主な機能:
 * - 作業項目データ（WorkItem）の管理
 * - コードマスタデータ（WorkCode）の管理
 * - データの追加・更新・削除
 * - 重複チェック機能
 */

interface DataContextType {
  workItems: WorkItem[]
  workCodes: WorkCode[]
  setWorkItems: (items: WorkItem[]) => void
  setWorkCodes: (codes: WorkCode[]) => void
  addWorkItems: (items: WorkItem[]) => void
  addWorkCodes: (codes: WorkCode[]) => void
  clearData: () => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [workCodes, setWorkCodes] = useState<WorkCode[]>([])

  const addWorkItems = (items: WorkItem[]) => {
    setWorkItems(prev => {
      // 重複チェック: srcHashで重複を排除
      const existingHashes = new Set(prev.map(item => item.srcHash))
      const uniqueNewItems = items.filter(item => !existingHashes.has(item.srcHash))
      
      return [...prev, ...uniqueNewItems]
    })
  }

  const addWorkCodes = (codes: WorkCode[]) => {
    setWorkCodes(prev => {
      // 重複チェック: subworkCodeで重複を排除
      const existingCodes = new Set(prev.map(code => code.subworkCode))
      const uniqueNewCodes = codes.filter(code => !existingCodes.has(code.subworkCode))
      
      return [...prev, ...uniqueNewCodes]
    })
  }

  const clearData = () => {
    setWorkItems([])
    setWorkCodes([])
  }

  return (
    <DataContext.Provider value={{
      workItems,
      workCodes,
      setWorkItems,
      setWorkCodes,
      addWorkItems,
      addWorkCodes,
      clearData
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

