import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Import from '../Import'
import { DataProvider } from '../../contexts/DataContext'
import { generateTestExcelFile, loadTestExcelFile } from '../../test/testDataGenerator'

// モック関数
const mockParseExcelFile = vi.fn()
const mockGenerateRowHash = vi.fn()

// モジュールのモック
vi.mock('../../utils/excelParser', () => ({
  parseExcelFile: mockParseExcelFile,
  generateRowHash: mockGenerateRowHash
}))

// テスト用のラッパーコンポーネント
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <DataProvider>
    {children}
  </DataProvider>
)

describe('Import Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateRowHash.mockReturnValue('test_hash')
  })

  it('should render import form correctly', () => {
    render(
      <TestWrapper>
        <Import />
      </TestWrapper>
    )

    expect(screen.getByText('データ取込')).toBeInTheDocument()
    expect(screen.getByText('Excelファイルをアップロードして日報データを取込ます')).toBeInTheDocument()
    expect(screen.getByText('ファイルをドラッグ&ドロップ')).toBeInTheDocument()
    expect(screen.getByText('ファイルを選択')).toBeInTheDocument()
    expect(screen.getByText('対応形式: .xlsx, .xls')).toBeInTheDocument()
  })

  it('should handle file input change', async () => {
    const mockFile = await loadTestExcelFile()
    const mockWorkItems = [
      {
        id: 'work_1',
        workDate: '2025-01-15',
        contractorName: '㈲三和工業',
        projectCode: 'S6290',
        subworkCode: '211',
        inHours: 8.0,
        outHours: 1.5,
        totalHours: 9.5,
        srcHash: 'test_hash',
        createdAt: '2025-01-15T00:00:00.000Z'
      }
    ]
    const mockWorkCodes = [
      {
        subworkCode: '211',
        subworkName: '配材作業',
        majorCode: '110',
        majorName: '組立',
        version: '1.0',
        updatedAt: '2025-01-15T00:00:00.000Z'
      }
    ]

    mockParseExcelFile.mockResolvedValue({
      workItems: mockWorkItems,
      workCodes: mockWorkCodes,
      columnMapping: {
        workDate: '日付',
        contractorName: '業者名',
        projectCode: '工事番号',
        subworkCode: '小区分',
        inHours: '規内',
        outHours: '規外'
      }
    })

    render(
      <TestWrapper>
        <Import />
      </TestWrapper>
    )

    const fileInput = screen.getByLabelText(/ファイルを選択/i)
    await user.upload(fileInput, mockFile)

    await waitFor(() => {
      expect(mockParseExcelFile).toHaveBeenCalledWith(mockFile)
    }, { timeout: 3000 })
  })

  it('should handle drag and drop', async () => {
    const mockFile = await loadTestExcelFile()
    const mockWorkItems = []
    const mockWorkCodes = []

    mockParseExcelFile.mockResolvedValue({
      workItems: mockWorkItems,
      workCodes: mockWorkCodes,
      columnMapping: {}
    })

    render(
      <TestWrapper>
        <Import />
      </TestWrapper>
    )

    const dropZone = screen.getByText('ファイルをドラッグ&ドロップ').closest('div')
    
    fireEvent.dragOver(dropZone!)
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [mockFile]
      }
    })

    await waitFor(() => {
      expect(mockParseExcelFile).toHaveBeenCalledWith(mockFile)
    }, { timeout: 3000 })
  })

  it('should display processing state', async () => {
    const mockFile = await loadTestExcelFile()
    
    // 非同期処理を遅延させる
    mockParseExcelFile.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        workItems: [],
        workCodes: [],
        columnMapping: {}
      }), 100))
    )

    render(
      <TestWrapper>
        <Import />
      </TestWrapper>
    )

    const fileInput = screen.getByLabelText(/ファイルを選択/i)
    await user.upload(fileInput, mockFile)

    expect(screen.getByText('ファイルを処理中...')).toBeInTheDocument()
  })

  it('should display error message on parse failure', async () => {
    const mockFile = await loadTestExcelFile()
    const errorMessage = 'ファイルの解析に失敗しました'

    mockParseExcelFile.mockRejectedValue(new Error(errorMessage))

    render(
      <TestWrapper>
        <Import />
      </TestWrapper>
    )

    const fileInput = screen.getByLabelText(/ファイルを選択/i)
    await user.upload(fileInput, mockFile)

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
      expect(screen.getByText(`ファイルの解析に失敗しました: ${errorMessage}`)).toBeInTheDocument()
    })
  })

  it('should display import result on success', async () => {
    const mockFile = await loadTestExcelFile()
    const mockWorkItems = [
      {
        id: 'work_1',
        workDate: '2025-01-15',
        contractorName: '㈲三和工業',
        projectCode: 'S6290',
        subworkCode: '211',
        inHours: 8.0,
        outHours: 1.5,
        totalHours: 9.5,
        srcHash: 'test_hash',
        createdAt: '2025-01-15T00:00:00.000Z'
      }
    ]
    const mockWorkCodes = [
      {
        subworkCode: '211',
        subworkName: '配材作業',
        majorCode: '110',
        majorName: '組立',
        version: '1.0',
        updatedAt: '2025-01-15T00:00:00.000Z'
      }
    ]

    mockParseExcelFile.mockResolvedValue({
      workItems: mockWorkItems,
      workCodes: mockWorkCodes,
      columnMapping: {
        workDate: '日付',
        contractorName: '業者名',
        projectCode: '工事番号',
        subworkCode: '小区分',
        inHours: '規内',
        outHours: '規外'
      }
    })

    render(
      <TestWrapper>
        <Import />
      </TestWrapper>
    )

    const fileInput = screen.getByLabelText(/ファイルを選択/i)
    await user.upload(fileInput, mockFile)

    await waitFor(() => {
      expect(screen.getByText('取込完了')).toBeInTheDocument()
      expect(screen.getByText('新規取込')).toBeInTheDocument()
      expect(screen.getByText('更新')).toBeInTheDocument()
    })
  })

  it('should display undefined codes warning', async () => {
    const mockFile = await loadTestExcelFile()
    const mockWorkItems = [
      {
        id: 'work_1',
        workDate: '2025-01-15',
        contractorName: '㈲三和工業',
        projectCode: 'S6290',
        subworkCode: '999', // 未定義のコード
        inHours: 8.0,
        outHours: 1.5,
        totalHours: 9.5,
        srcHash: 'test_hash',
        createdAt: '2025-01-15T00:00:00.000Z'
      }
    ]
    const mockWorkCodes = [] // 空のコードリスト

    mockParseExcelFile.mockResolvedValue({
      workItems: mockWorkItems,
      workCodes: mockWorkCodes,
      columnMapping: {}
    })

    render(
      <TestWrapper>
        <Import />
      </TestWrapper>
    )

    const fileInput = screen.getByLabelText(/ファイルを選択/i)
    await user.upload(fileInput, mockFile)

    await waitFor(() => {
      expect(screen.getByText(/未定義の小区分コードが 1 件見つかりました/)).toBeInTheDocument()
    })
  })
})
