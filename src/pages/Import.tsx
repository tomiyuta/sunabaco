import { useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react'
import { parseExcelFile, generateRowHash } from '../utils/excelParser'
import { WorkItem, WorkCode, ImportResult, ColumnMapping, AppError } from '../types'
import { useData } from '../contexts/DataContext'
import { getUserFriendlyMessage, validateFileType } from '../utils/errorHandler'

export default function Import() {
  const { addWorkItems, addWorkCodes } = useData()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [workCodes, setWorkCodes] = useState<WorkCode[]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [errors, setErrors] = useState<string[]>([])
  const [appError, setAppError] = useState<AppError | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const excelFile = files.find(file => 
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    )
    
    if (excelFile) {
      handleFileUpload(excelFile)
    }
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }, [])

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true)
    setErrors([])
    setAppError(null)
    setImportResult(null)

    // ファイル形式のバリデーション
    const validation = validateFileType(file)
    if (!validation.isValid) {
      setErrors(validation.errors)
      setIsProcessing(false)
      return
    }

    // 警告がある場合は表示
    if (validation.warnings.length > 0) {
      setErrors(prev => [...prev, ...validation.warnings])
    }

    try {
      const { workItems: parsedWorkItems, workCodes: parsedWorkCodes, columnMapping: mapping } = await parseExcelFile(file)
      
      // ハッシュの生成と重複チェック
      const itemsWithHash = parsedWorkItems.map(item => ({
        ...item,
        srcHash: generateRowHash(item)
      }))
      
      // 重複チェック（簡易版）
      const hashSet = new Set<string>()
      const duplicates: WorkItem[] = []
      const uniqueItems: WorkItem[] = []
      
      itemsWithHash.forEach(item => {
        if (hashSet.has(item.srcHash)) {
          duplicates.push(item)
        } else {
          hashSet.add(item.srcHash)
          uniqueItems.push(item)
        }
      })
      
      // 未定義コードのチェック
      const definedCodes = new Set(parsedWorkCodes.map(code => code.subworkCode))
      const undefinedCodes = uniqueItems.filter(item => 
        item.subworkCode && !definedCodes.has(item.subworkCode)
      )
      
      const result: ImportResult = {
        jobId: `job_${Date.now()}`,
        inserted: uniqueItems.length,
        updated: 0,
        duplicates: duplicates.length,
        errors: 0,
        undefinedCodes: undefinedCodes.length
      }
      
      setWorkItems(uniqueItems)
      setWorkCodes(parsedWorkCodes)
      setColumnMapping(mapping)
      setImportResult(result)
      
      // データをコンテキストに追加
      
      addWorkItems(uniqueItems)
      addWorkCodes(parsedWorkCodes)
      
      if (undefinedCodes.length > 0) {
        setErrors([`未定義の小区分コードが ${undefinedCodes.length} 件見つかりました`])
      }
      
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        // AppErrorの場合
        const appError = error as AppError
        setAppError(appError)
        setErrors([getUserFriendlyMessage(appError)])
      } else {
        // その他のエラーの場合
        setErrors([`ファイルの解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`])
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">データ取込</h1>
        <p className="text-gray-600 mt-1">Excelファイルをアップロードして日報データを取込ます</p>
      </div>

      {/* ファイルアップロードエリア */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
          <div>
            <p className="text-lg font-medium text-gray-900">
              ファイルをドラッグ&ドロップ
            </p>
            <p className="text-gray-500">または</p>
            <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer touch-target">
              <Upload className="mr-2 h-4 w-4" />
              ファイルを選択
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
                disabled={isProcessing}
              />
            </label>
          </div>
          <p className="text-sm text-gray-500">
            対応形式: .xlsx, .xls
          </p>
        </div>
      </div>

      {/* 処理中表示 */}
      {isProcessing && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">ファイルを処理中...</span>
        </div>
      )}

      {/* エラー表示 */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
                {appError && (
                  <div className="mt-3 p-3 bg-red-100 rounded border">
                    <p className="text-xs text-red-600">
                      <strong>エラーコード:</strong> {appError.code}
                    </p>
                    <p className="text-xs text-red-600">
                      <strong>発生時刻:</strong> {new Date(appError.timestamp).toLocaleString()}
                    </p>
                    {appError.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-red-600 cursor-pointer">詳細情報</summary>
                        <pre className="text-xs text-red-600 mt-1 overflow-auto">
                          {JSON.stringify(appError.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 取込結果表示 */}
      {importResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <h3 className="text-lg font-medium text-gray-900 ml-2">取込完了</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{importResult.inserted}</div>
              <div className="text-sm text-gray-500">新規取込</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{importResult.updated}</div>
              <div className="text-sm text-gray-500">更新</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
              <div className="text-sm text-gray-500">重複</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
              <div className="text-sm text-gray-500">エラー</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{importResult.undefinedCodes}</div>
              <div className="text-sm text-gray-500">未定義コード</div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>ジョブID: {importResult.jobId}</p>
          </div>
        </div>
      )}

      {/* 列マッピング表示 */}
      {Object.keys(columnMapping).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">列マッピング</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(columnMapping).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium text-gray-700">{key}</span>
                <span className="text-gray-600">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* データプレビュー */}
      {workItems.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">データプレビュー</h3>
            <p className="text-sm text-gray-600">最初の10件を表示</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日付</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">業者</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工事番号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">小区分</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">規内</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">規外</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">計</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workItems.slice(0, 10).map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.workDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.contractorName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.projectCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.subworkCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.inHours}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.outHours}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.totalHours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

