'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/auth/require-org'
import { pesosToCentavos } from '@/lib/formatting/currency'

export async function createEmployee(prevState: { error: string } | null | void, formData: FormData) {
  const { supabase, orgId } = await requireOrg()

  const { error } = await supabase.from('employees').insert({
    organization_id: orgId,
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    middle_name: (formData.get('middle_name') as string) || null,
    position: (formData.get('position') as string) || null,
    employment_type: formData.get('employment_type') as string,
    tax_status: formData.get('tax_status') as string,
    monthly_basic_salary: pesosToCentavos(formData.get('monthly_basic_salary') as string),
    allowances: pesosToCentavos((formData.get('allowances') as string) || '0'),
    tin: (formData.get('tin') as string) || null,
    sss_number: (formData.get('sss_number') as string) || null,
    philhealth_number: (formData.get('philhealth_number') as string) || null,
    pagibig_number: (formData.get('pagibig_number') as string) || null,
    date_hired: (formData.get('date_hired') as string) || null,
    bank_name: (formData.get('bank_name') as string) || null,
    bank_account: (formData.get('bank_account') as string) || null,
    status: 'active',
  })

  if (error) return { error: error.message }

  revalidatePath('/employees')
  redirect('/employees')
}

export async function updateEmployee(id: string, prevState: { error: string } | null | void, formData: FormData) {
  const { supabase, orgId } = await requireOrg()

  const { error } = await supabase
    .from('employees')
    .update({
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      middle_name: (formData.get('middle_name') as string) || null,
      position: (formData.get('position') as string) || null,
      employment_type: formData.get('employment_type') as string,
      tax_status: formData.get('tax_status') as string,
      monthly_basic_salary: pesosToCentavos(formData.get('monthly_basic_salary') as string),
      allowances: pesosToCentavos((formData.get('allowances') as string) || '0'),
      tin: (formData.get('tin') as string) || null,
      sss_number: (formData.get('sss_number') as string) || null,
      philhealth_number: (formData.get('philhealth_number') as string) || null,
      pagibig_number: (formData.get('pagibig_number') as string) || null,
      date_hired: (formData.get('date_hired') as string) || null,
      bank_name: (formData.get('bank_name') as string) || null,
      bank_account: (formData.get('bank_account') as string) || null,
    })
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/employees')
  redirect('/employees')
}

export async function archiveEmployee(id: string) {
  const { supabase, orgId } = await requireOrg()

  await supabase
    .from('employees')
    .update({ status: 'inactive', deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', orgId)

  revalidatePath('/employees')
}
