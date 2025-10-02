import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseExcelFile, parseDate, parseNumber, parseString, detectColumns, generateRowHash } from '../excelParser'
import { generateTestExcelFile, generateEmptyExcelFile, generateTestWorkItems, loadTestExcelFile } from '../../test/testDataGenerator'

// FileReaderのモック
const mockFileReader = {
  readAsArrayBuffer: vi.fn(),
  result: null,
  onload: null,
  onerror: null,
  readyState: 0
}

// グローバルなFileReaderをモック
Object.defineProperty(global, 'FileReader', {
  value: vi.fn(() => mockFileReader),
  writable: true
})

describe('excelParser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFileReader.result = null
    mockFileReader.onload = null
    mockFileReader.onerror = null
    mockFileReader.readyState = 0
  })

  describe('parseDate', () => {
    it('should parse YYYYMMDD format', () => {
      expect(parseDate('20250115')).toBe('2025-01-15')
    })

    it('should parse Excel serial number', () => {
      const result = parseDate('44927') // Excel serial for 2023-01-01
      expect(result).toMatch(/2023-01-01/)
    })

    it('should parse existing date format', () => {
      expect(parseDate('2025-01-15')).toBe('2025-01-15')
    })

    it('should return null for invalid input', () => {
      expect(parseDate('')).toBeNull()
      expect(parseDate(null)).toBeNull()
      expect(parseDate(undefined)).toBeNull()
    })
  })

  describe('parseNumber', () => {
    it('should parse valid numbers', () => {
      expect(parseNumber('8.5')).toBe(8.5)
      expect(parseNumber(10)).toBe(10)
      expect(parseNumber('0')).toBe(0)
    })

    it('should return 0 for invalid input', () => {
      expect(parseNumber('')).toBe(0)
      expect(parseNumber('abc')).toBe(0)
      expect(parseNumber(null)).toBe(0)
      expect(parseNumber(undefined)).toBe(0)
    })
  })

  describe('parseString', () => {
    it('should parse valid strings', () => {
      expect(parseString('test')).toBe('test')
      expect(parseString('  test  ')).toBe('test')
    })

    it('should return empty string for invalid input', () => {
      expect(parseString('')).toBe('')
      expect(parseString(null)).toBe('')
      expect(parseString(undefined)).toBe('')
    })
  })

  describe('detectColumns', () => {
    it('should detect columns correctly', () => {
      const headers = ['日付', '業者名', '工事番号', '小区分', '規内', '規外']
      const result = detectColumns(headers)
      
      expect(result.workDate).toBe('日付')
      expect(result.contractorName).toBe('業者名')
      expect(result.projectCode).toBe('工事番号')
      expect(result.subworkCode).toBe('小区分')
      expect(result.inHours).toBe('規内')
      expect(result.outHours).toBe('規外')
    })

    it('should handle empty headers', () => {
      const result = detectColumns([])
      expect(result).toEqual({})
    })

    it('should handle partial matches', () => {
      const headers = ['日付(YYYYMMDD)', '業者名', '工事番号(Sxxxx)', '小区分(code例: 25K/211/...)', '規内(numeric)', '規外(numeric)']
      const result = detectColumns(headers)
      
      expect(result.workDate).toBe('日付(YYYYMMDD)')
      expect(result.contractorName).toBe('業者名')
      expect(result.projectCode).toBe('工事番号(Sxxxx)')
      expect(result.subworkCode).toBe('小区分(code例: 25K/211/...)')
      expect(result.inHours).toBe('規内(numeric)')
      expect(result.outHours).toBe('規外(numeric)')
    })
  })

  describe('generateRowHash', () => {
    it('should generate consistent hash for same input', () => {
      const workItem = generateTestWorkItems()[0]
      const hash1 = generateRowHash(workItem)
      const hash2 = generateRowHash(workItem)
      expect(hash1).toBe(hash2)
    })

    it('should generate different hash for different input', () => {
      const workItems = generateTestWorkItems()
      const hash1 = generateRowHash(workItems[0])
      const hash2 = generateRowHash(workItems[1])
      expect(hash1).not.toBe(hash2)
    })

    it('should handle Japanese characters', () => {
      const workItem = {
        ...generateTestWorkItems()[0],
        contractorName: '㈲三和工業'
      }
      const hash = generateRowHash(workItem)
      expect(hash).toBeTruthy()
      expect(typeof hash).toBe('string')
    })
  })

  describe('parseExcelFile', () => {
    it('should parse valid Excel file', async () => {
      const testFile = await loadTestExcelFile()
      
      // FileReaderのモックを設定
      const mockArrayBuffer = new ArrayBuffer(0)
      mockFileReader.result = mockArrayBuffer
      mockFileReader.readyState = 2
      
      // XLSX.readのモック
      vi.mocked(XLSX.read).mockReturnValueOnce({
        SheetNames: ['データ(日報)', 'コード'],
        Sheets: {
          'データ(日報)': {
            '!ref': 'A1:K6',
            A1: { v: '日付' },
            B1: { v: '業者名' },
            C1: { v: '報告者名' },
            D1: { v: '在籍' },
            E1: { v: '雇' },
            F1: { v: '工事番号' },
            G1: { v: '小区画' },
            H1: { v: '小区分' },
            I1: { v: '規内' },
            J1: { v: '規外' },
            K1: { v: '計' },
            A2: { v: '20250115' },
            B2: { v: '㈲三和工業' },
            C2: { v: '田中太郎' },
            D2: { v: 5 },
            E2: { v: '正社員' },
            F2: { v: 'S6290' },
            G2: { v: 'B12P' },
            H2: { v: '211' },
            I2: { v: 8.0 },
            J2: { v: 1.5 },
            K2: { v: 9.5 },
            A3: { v: '20250116' },
            B3: { v: '㈲三和工業' },
            C3: { v: '佐藤花子' },
            D3: { v: 3 },
            E3: { v: '正社員' },
            F3: { v: 'S6290' },
            G3: { v: 'B12P' },
            H3: { v: '212' },
            I3: { v: 7.5 },
            J3: { v: 0.5 },
            K3: { v: 8.0 }
          },
          'コード': {
            '!ref': 'A1:E6',
            A1: { v: '大区分' },
            B1: { v: '大区分名称' },
            C1: { v: '小区分' },
            D1: { v: '小区分名称' },
            E1: { v: '備考' },
            A2: { v: '110' },
            B2: { v: '組立' },
            C2: { v: '211' },
            D2: { v: '配材作業' },
            E2: { v: '材料の準備作業' },
            A3: { v: '110' },
            B3: { v: '組立' },
            C3: { v: '212' },
            D3: { v: '組立作業' },
            E3: { v: '部品の組み立て' }
          }
        }
      } as any)

      // FileReaderのonloadイベントを手動でトリガー
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({} as any)
        }
      }, 100)

      const result = await parseExcelFile(testFile)
      
      expect(result.workItems).toHaveLength(2)
      expect(result.workCodes).toHaveLength(2)
      expect(result.columnMapping).toBeDefined()
    }, 10000)

    it('should handle file read error', async () => {
      const testFile = await loadTestExcelFile()
      
      mockFileReader.onerror = vi.fn()
      mockFileReader.readyState = 2
      
      // FileReaderのonerrorイベントを手動でトリガー
      setTimeout(() => {
        if (mockFileReader.onerror) {
          mockFileReader.onerror({} as any)
        }
      }, 100)
      
      await expect(parseExcelFile(testFile)).rejects.toThrow('ファイルの読み込みに失敗しました')
    }, 10000)

    it('should handle missing data sheet', async () => {
      const testFile = await loadTestExcelFile()
      
      mockFileReader.result = new ArrayBuffer(0)
      mockFileReader.readyState = 2
      
      // XLSX.readのモック（シートなし）
      vi.mocked(XLSX.read).mockReturnValueOnce({
        SheetNames: [],
        Sheets: {}
      } as any)

      // FileReaderのonloadイベントを手動でトリガー
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({} as any)
        }
      }, 100)

      await expect(parseExcelFile(testFile)).rejects.toThrow('日報データシートが見つかりません')
    }, 10000)
  })
})
