import { requireOrg } from '@/lib/auth/require-org'
import { CategoryForm } from '@/components/category-form'
import { createCategory, deleteCategory } from '@/app/actions/categories'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'

export default async function CategoriesPage() {
  const { supabase, orgId } = await requireOrg()

  const { data: categories } = await supabase
    .from('expense_categories')
    .select('id, name, type, color, gl_account_code')
    .eq('organization_id', orgId)
    .order('type')
    .order('name')

  const list = categories ?? []
  const expenses = list.filter(c => c.type === 'expense')
  const incomes = list.filter(c => c.type === 'income')

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-500 mt-1">Manage expense and income categories for your transactions.</p>
      </div>

      {/* Add new category */}
      <div className="border rounded-xl p-5 bg-white space-y-3">
        <h2 className="font-semibold text-gray-800">Add Category</h2>
        <CategoryForm action={createCategory} />
      </div>

      {/* Expense categories */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-700 text-sm">Expense Categories</h2>
        </div>
        {!expenses.length ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">No expense categories yet.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y">
              {expenses.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 w-5">
                    <span className="block w-3 h-3 rounded-full" style={{ backgroundColor: cat.color ?? '#6B7280' }} />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{cat.gl_account_code ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">Expense</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteCategory.bind(null, cat.id)}>
                      <button type="submit" className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Income categories */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-700 text-sm">Income Categories</h2>
        </div>
        {!incomes.length ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">No income categories yet.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y">
              {incomes.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 w-5">
                    <span className="block w-3 h-3 rounded-full" style={{ backgroundColor: cat.color ?? '#6B7280' }} />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{cat.gl_account_code ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">Income</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteCategory.bind(null, cat.id)}>
                      <button type="submit" className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
