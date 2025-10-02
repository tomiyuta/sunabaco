import { useState } from 'react'
import { Plus, Edit, Save, X, AlertTriangle } from 'lucide-react'

interface WorkCode {
  subworkCode: string
  subworkName: string
  majorCode: string
  majorName: string
  note?: string
}

// モックデータ
const mockCodes: WorkCode[] = [
  { subworkCode: '211', subworkName: '配材作業', majorCode: '110', majorName: '組立', note: '材料の準備作業' },
  { subworkCode: '212', subworkName: '組立作業', majorCode: '110', majorName: '組立', note: '部品の組み立て' },
  { subworkCode: '221', subworkName: '配管作業', majorCode: '120', majorName: '配管', note: '配管の設置' },
  { subworkCode: '222', subworkName: '配管検査', majorCode: '120', majorName: '配管', note: '配管の検査' },
  { subworkCode: '231', subworkName: '電気配線', majorCode: '130', majorName: '電気', note: '電気配線作業' },
]

const undefinedCodes = [
  { subworkCode: '999', count: 5, firstSeen: '2025-01-15' },
  { subworkCode: '888', count: 3, firstSeen: '2025-01-14' },
]

export default function Codes() {
  const [codes, setCodes] = useState<WorkCode[]>(mockCodes)
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<WorkCode | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newCode, setNewCode] = useState<WorkCode>({
    subworkCode: '',
    subworkName: '',
    majorCode: '',
    majorName: '',
    note: ''
  })

  const handleEdit = (code: WorkCode) => {
    setEditingCode(code.subworkCode)
    setEditingData({ ...code })
  }

  const handleSave = () => {
    if (editingData) {
      setCodes(codes.map(code => 
        code.subworkCode === editingData.subworkCode ? editingData : code
      ))
    }
    setEditingCode(null)
    setEditingData(null)
  }

  const handleCancel = () => {
    setEditingCode(null)
    setEditingData(null)
    setIsAddingNew(false)
    setNewCode({
      subworkCode: '',
      subworkName: '',
      majorCode: '',
      majorName: '',
      note: ''
    })
  }

  const handleAddNew = () => {
    if (newCode.subworkCode && newCode.subworkName && newCode.majorCode && newCode.majorName) {
      setCodes([...codes, newCode])
      setNewCode({
        subworkCode: '',
        subworkName: '',
        majorCode: '',
        majorName: '',
        note: ''
      })
      setIsAddingNew(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">コード管理</h1>
          <p className="text-gray-600 mt-1">小区分コードの管理と未定義コードの対応</p>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 touch-target"
        >
          <Plus className="h-4 w-4 mr-2" />
          新規追加
        </button>
      </div>

      {/* 未定義コード警告 */}
      {undefinedCodes.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">未定義コードが検出されました</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>以下のコードがデータに含まれていますが、コードマスタに登録されていません。</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {undefinedCodes.map((code) => (
                    <li key={code.subworkCode}>
                      コード: {code.subworkCode} (出現回数: {code.count}, 初回: {code.firstSeen})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* コード一覧 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">コードマスタ</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">小区分コード</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">小区分名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">大区分コード</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">大区分名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">備考</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {codes.map((code) => (
                <tr key={code.subworkCode}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingCode === code.subworkCode ? (
                      <input
                        type="text"
                        value={editingData?.subworkCode || ''}
                        onChange={(e) => setEditingData(prev => prev ? { ...prev, subworkCode: e.target.value } : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-ipad"
                      />
                    ) : (
                      code.subworkCode
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingCode === code.subworkCode ? (
                      <input
                        type="text"
                        value={editingData?.subworkName || ''}
                        onChange={(e) => setEditingData(prev => prev ? { ...prev, subworkName: e.target.value } : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-ipad"
                      />
                    ) : (
                      code.subworkName
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingCode === code.subworkCode ? (
                      <input
                        type="text"
                        value={editingData?.majorCode || ''}
                        onChange={(e) => setEditingData(prev => prev ? { ...prev, majorCode: e.target.value } : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-ipad"
                      />
                    ) : (
                      code.majorCode
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingCode === code.subworkCode ? (
                      <input
                        type="text"
                        value={editingData?.majorName || ''}
                        onChange={(e) => setEditingData(prev => prev ? { ...prev, majorName: e.target.value } : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-ipad"
                      />
                    ) : (
                      code.majorName
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingCode === code.subworkCode ? (
                      <input
                        type="text"
                        value={editingData?.note || ''}
                        onChange={(e) => setEditingData(prev => prev ? { ...prev, note: e.target.value } : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-ipad"
                      />
                    ) : (
                      code.note || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingCode === code.subworkCode ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          className="text-green-600 hover:text-green-900 touch-target"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-900 touch-target"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(code)}
                        className="text-blue-600 hover:text-blue-900 touch-target"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {/* 新規追加行 */}
              {isAddingNew && (
                <tr className="bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={newCode.subworkCode}
                      onChange={(e) => setNewCode(prev => ({ ...prev, subworkCode: e.target.value }))}
                      placeholder="小区分コード"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-ipad"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={newCode.subworkName}
                      onChange={(e) => setNewCode(prev => ({ ...prev, subworkName: e.target.value }))}
                      placeholder="小区分名称"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-ipad"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={newCode.majorCode}
                      onChange={(e) => setNewCode(prev => ({ ...prev, majorCode: e.target.value }))}
                      placeholder="大区分コード"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-ipad"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={newCode.majorName}
                      onChange={(e) => setNewCode(prev => ({ ...prev, majorName: e.target.value }))}
                      placeholder="大区分名称"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-ipad"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={newCode.note}
                      onChange={(e) => setNewCode(prev => ({ ...prev, note: e.target.value }))}
                      placeholder="備考"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-ipad"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={handleAddNew}
                        className="text-green-600 hover:text-green-900 touch-target"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-gray-600 hover:text-gray-900 touch-target"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

