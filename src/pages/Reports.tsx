import { useState, useMemo } from 'react'
import { Download, Filter, Calendar, Building, User, BarChart3, PieChart } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'
import { useData } from '../contexts/DataContext'
import { WorkItem, WorkCode, ReportData, TimeSeriesData } from '../types'
import { aggregateByWorkType } from '../utils/dataAggregation'

export default function Reports() {
  const { workItems, workCodes } = useData()
  const [filters, setFilters] = useState({
    project: '',
    contractor: '',
    fromDate: '',
    toDate: '',
    groupBy: ['工事番号', '大区分', '小区分']
  })
  const [showFilters, setShowFilters] = useState(false)
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar')
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'timeseries'>('summary')

  // フィルタリングされたデータを取得
  const filteredData = useMemo(() => {
    return workItems.filter(item => {
      if (filters.project && !item.projectCode.includes(filters.project)) return false
      if (filters.contractor && !item.contractorName.includes(filters.contractor)) return false
      if (filters.fromDate && item.workDate < filters.fromDate) return false
      if (filters.toDate && item.workDate > filters.toDate) return false
      return true
    })
  }, [workItems, filters])

  // レポートデータを生成
  const reportData = useMemo((): ReportData[] => {
    if (filteredData.length === 0) return []

    // dataAggregationの関数を使用して集計
    const workTypeData = aggregateByWorkType(filteredData, workCodes)
    
    // 工事番号別にグループ化してレポートデータを生成
    const projectGroups = new Map<string, ReportData>()
    
    filteredData.forEach(item => {
      const workCode = workCodes.find(code => code.subworkCode === item.subworkCode)
      const majorName = workCode?.majorName || '未定義'
      const subworkName = workCode?.subworkName || '未定義'
      
      const key = `${item.projectCode}_${item.subworkCode}`
      if (!projectGroups.has(key)) {
        projectGroups.set(key, {
          工事番号: item.projectCode,
          大区分: majorName,
          小区分: subworkName,
          規内: 0,
          規外: 0,
          計: 0,
          規外比率: 0
        })
      }
      
      const group = projectGroups.get(key)!
      group.規内 += item.inHours
      group.規外 += item.outHours
      group.計 += item.totalHours
    })
    
    // 規外比率を計算して返す
    return Array.from(projectGroups.values()).map(group => {
      const 規外比率 = group.計 > 0 ? group.規外 / group.計 : 0
      return {
        ...group,
        規内: Math.round(group.規内 * 10) / 10,
        規外: Math.round(group.規外 * 10) / 10,
        計: Math.round(group.計 * 10) / 10,
        規外比率: Math.round(規外比率 * 1000) / 1000
      }
    }).sort((a, b) => b.計 - a.計)
  }, [filteredData, workCodes])

  // 時系列データを生成
  const timeSeriesData = useMemo((): TimeSeriesData[] => {
    if (filteredData.length === 0) return []

    const dailyData = filteredData.reduce((acc, item) => {
      if (!acc[item.workDate]) {
        acc[item.workDate] = { 規内: 0, 規外: 0, 計: 0 }
      }
      acc[item.workDate].規内 += item.inHours
      acc[item.workDate].規外 += item.outHours
      acc[item.workDate].計 += item.totalHours
      return acc
    }, {} as Record<string, any>)

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        規内: Math.round(data.規内 * 10) / 10,
        規外: Math.round(data.規外 * 10) / 10,
        計: Math.round(data.計 * 10) / 10
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredData])

  // 工種別集計データ（dataAggregationの関数を使用）
  const workTypeData = useMemo(() => {
    if (filteredData.length === 0) return []
    return aggregateByWorkType(filteredData, workCodes)
  }, [filteredData, workCodes])

  const handleExportCSV = () => {
    if (reportData.length === 0) return

    const csvContent = [
      Object.keys(reportData[0]).join(','),
      ...reportData.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `工数集計_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    // PDF出力の実装（簡易版）
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">レポート</h1>
          <p className="text-gray-600 mt-1">
            工数集計の詳細レポートとエクスポート
            {workItems.length > 0 && (
              <span className="ml-2 text-sm text-blue-600">
                (データ件数: {workItems.length}件)
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExportCSV}
            disabled={reportData.length === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV出力
          </button>
          <button
            onClick={handleExportPDF}
            disabled={reportData.length === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
          >
            <Download className="h-4 w-4 mr-2" />
            PDF出力
          </button>
        </div>
      </div>

      {/* フィルタ */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 touch-target"
          >
            <Filter className="h-4 w-4 mr-2" />
            フィルタ条件
          </button>
        </div>
        {showFilters && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">工事番号</label>
                <input
                  type="text"
                  value={filters.project}
                  onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
                  placeholder="例: S6290"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-ipad"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">業者</label>
                <input
                  type="text"
                  value={filters.contractor}
                  onChange={(e) => setFilters(prev => ({ ...prev, contractor: e.target.value }))}
                  placeholder="例: ㈲三和工業"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-ipad"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">開始日</label>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-ipad"
                  aria-label="開始日"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">終了日</label>
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-ipad"
                  aria-label="終了日"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 touch-target">
                フィルタ適用
              </button>
            </div>
          </div>
        )}
      </div>

      {/* レポートタイプ選択 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">レポートタイプ</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setReportType('summary')}
              className={`flex items-center px-4 py-2 text-sm rounded ${
                reportType === 'summary' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              } touch-target`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              工種別集計
            </button>
            <button
              onClick={() => setReportType('detailed')}
              className={`flex items-center px-4 py-2 text-sm rounded ${
                reportType === 'detailed' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              } touch-target`}
            >
              <Building className="h-4 w-4 mr-2" />
              詳細レポート
            </button>
            <button
              onClick={() => setReportType('timeseries')}
              className={`flex items-center px-4 py-2 text-sm rounded ${
                reportType === 'timeseries' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              } touch-target`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              時系列分析
            </button>
          </div>
        </div>
      </div>

      {/* 集計結果 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {reportType === 'summary' && '工種別集計'}
              {reportType === 'detailed' && '詳細レポート'}
              {reportType === 'timeseries' && '時系列分析'}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 text-sm rounded ${
                  chartType === 'bar' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                } touch-target`}
              >
                棒グラフ
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 text-sm rounded ${
                  chartType === 'line' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                } touch-target`}
              >
                折れ線グラフ
              </button>
              <button
                onClick={() => setChartType('pie')}
                className={`px-3 py-1 text-sm rounded ${
                  chartType === 'pie' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                } touch-target`}
              >
                円グラフ
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {reportData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>データがありません</p>
                <p className="text-sm">データ取込ページでExcelファイルをアップロードしてください</p>
              </div>
            </div>
          ) : (
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={reportType === 'summary' ? workTypeData : reportType === 'timeseries' ? timeSeriesData : reportData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey={reportType === 'timeseries' ? 'date' : reportType === 'summary' ? 'name' : '小区分'} 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="規内" fill="#3B82F6" name="規内" />
                    <Bar dataKey="規外" fill="#EF4444" name="規外" />
                  </BarChart>
                ) : chartType === 'line' ? (
                  <LineChart data={reportType === 'timeseries' ? timeSeriesData : workTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey={reportType === 'timeseries' ? 'date' : 'name'} 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="規内" stroke="#3B82F6" strokeWidth={2} name="規内" />
                    <Line type="monotone" dataKey="規外" stroke="#EF4444" strokeWidth={2} name="規外" />
                  </LineChart>
                ) : (
                  <RechartsPieChart>
                    <Pie
                      data={workTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="計"
                    >
                      {workTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* 詳細テーブル */}
      {reportData.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {reportType === 'summary' && '工種別集計データ'}
              {reportType === 'detailed' && '詳細レポートデータ'}
              {reportType === 'timeseries' && '時系列データ'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {reportData.length}件のデータを表示中
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工事番号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">大区分</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">小区分</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">規内</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">規外</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">計</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">規外比率</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.slice(0, 50).map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.工事番号}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.大区分}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.小区分}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.規内}h</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.規外}h</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.計}h</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        row.規外比率 > 0.1 ? 'bg-red-100 text-red-800' : 
                        row.規外比率 > 0.05 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {(row.規外比率 * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reportData.length > 50 && (
              <div className="px-6 py-4 bg-gray-50 text-center text-sm text-gray-600">
                最初の50件を表示中（全{reportData.length}件）
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

