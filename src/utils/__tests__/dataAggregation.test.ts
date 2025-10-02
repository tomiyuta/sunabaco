import { describe, it, expect } from 'vitest'
import { aggregateByWorkType, generateRatioData, calculateTotals } from '../dataAggregation'
import { generateTestWorkItems, generateTestWorkCodes } from '../../test/testDataGenerator'

describe('dataAggregation', () => {
  describe('aggregateByWorkType', () => {
    it('should aggregate work items by work type correctly', () => {
      const workItems = generateTestWorkItems()
      const workCodes = generateTestWorkCodes()
      
      const result = aggregateByWorkType(workItems, workCodes)
      
      expect(result).toHaveLength(1) // 同じ工種（組立）にグループ化される
      expect(result[0].name).toBe('組立')
      expect(result[0].規内).toBe(15.5) // 8.0 + 7.5
      expect(result[0].規外).toBe(2.0) // 1.5 + 0.5
      expect(result[0].計).toBe(17.5) // 15.5 + 2.0
    })

    it('should handle empty work items', () => {
      const result = aggregateByWorkType([], generateTestWorkCodes())
      expect(result).toHaveLength(0)
    })

    it('should handle empty work codes', () => {
      const workItems = generateTestWorkItems()
      const result = aggregateByWorkType(workItems, [])
      
      expect(result).toHaveLength(2) // 各プロジェクト+小区分の組み合わせ
      expect(result[0].name).toMatch(/工事S6290_211/)
      expect(result[1].name).toMatch(/工事S6290_212/)
    })

    it('should group by project code and subwork code', () => {
      const workItems = [
        ...generateTestWorkItems(),
        {
          ...generateTestWorkItems()[0],
          projectCode: 'S6291',
          subworkCode: '25K',
          inHours: 8.0,
          outHours: 2.0,
          totalHours: 10.0
        }
      ]
      const workCodes = [
        ...generateTestWorkCodes(),
        {
          subworkCode: '25K',
          subworkName: '配管作業',
          majorCode: '120',
          majorName: '配管',
          version: '1.0',
          updatedAt: '2025-01-15T00:00:00.000Z'
        }
      ]
      
      const result = aggregateByWorkType(workItems, workCodes)
      
      expect(result).toHaveLength(2) // 組立と配管
      const assemblyWork = result.find(r => r.name === '組立')
      const pipeWork = result.find(r => r.name === '配管')
      
      expect(assemblyWork).toBeDefined()
      expect(pipeWork).toBeDefined()
      expect(pipeWork?.規内).toBe(8.0)
      expect(pipeWork?.規外).toBe(2.0)
    })
  })

  describe('generateRatioData', () => {
    it('should generate correct ratio data', () => {
      const workItems = generateTestWorkItems()
      const result = generateRatioData(workItems)
      
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('規内')
      expect(result[0].value).toBe(15.5) // 8.0 + 7.5
      expect(result[0].color).toBe('#3B82F6')
      expect(result[1].name).toBe('規外')
      expect(result[1].value).toBe(2.0) // 1.5 + 0.5
      expect(result[1].color).toBe('#EF4444')
    })

    it('should handle empty work items', () => {
      const result = generateRatioData([])
      
      expect(result).toHaveLength(2)
      expect(result[0].value).toBe(0)
      expect(result[1].value).toBe(0)
    })
  })

  describe('calculateTotals', () => {
    it('should calculate totals correctly', () => {
      const workItems = generateTestWorkItems()
      const result = calculateTotals(workItems)
      
      expect(result.totalInHours).toBe(15.5) // 8.0 + 7.5
      expect(result.totalOutHours).toBe(2.0) // 1.5 + 0.5
      expect(result.totalHours).toBe(17.5) // 15.5 + 2.0
      expect(result.overtimeRatio).toBe(11.4) // (2.0 / 17.5) * 100
    })

    it('should handle empty work items', () => {
      const result = calculateTotals([])
      
      expect(result.totalInHours).toBe(0)
      expect(result.totalOutHours).toBe(0)
      expect(result.totalHours).toBe(0)
      expect(result.overtimeRatio).toBe(0)
    })

    it('should handle zero total hours', () => {
      const workItems = [
        {
          ...generateTestWorkItems()[0],
          inHours: 0,
          outHours: 0,
          totalHours: 0
        }
      ]
      const result = calculateTotals(workItems)
      
      expect(result.totalInHours).toBe(0)
      expect(result.totalOutHours).toBe(0)
      expect(result.totalHours).toBe(0)
      expect(result.overtimeRatio).toBe(0)
    })

    it('should round overtime ratio to 1 decimal place', () => {
      const workItems = [
        {
          ...generateTestWorkItems()[0],
          inHours: 3,
          outHours: 1,
          totalHours: 4
        }
      ]
      const result = calculateTotals(workItems)
      
      expect(result.overtimeRatio).toBe(25.0) // (1 / 4) * 100 = 25.0
    })
  })
})
