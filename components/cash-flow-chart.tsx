'use client'

interface MonthData {
  label: string
  income: number
  expenses: number
}

interface CashFlowChartProps {
  data: MonthData[]
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  if (!data.length) return null

  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expenses]), 1)
  const chartH = 120
  const barW = 18
  const gap = 6
  const groupW = barW * 2 + gap + 12
  const totalW = groupW * data.length

  function barH(val: number) {
    return Math.max(2, Math.round((val / maxVal) * chartH))
  }

  function fmt(centavos: number) {
    const p = centavos / 100
    if (p >= 1_000_000) return `₱${(p / 1_000_000).toFixed(1)}M`
    if (p >= 1_000) return `₱${(p / 1_000).toFixed(0)}K`
    return `₱${p.toFixed(0)}`
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${totalW} ${chartH + 28}`}
        className="w-full"
        style={{ minWidth: `${Math.max(totalW, 200)}px`, height: `${chartH + 28}px` }}
      >
        {data.map((d, i) => {
          const x = i * groupW
          const incH = barH(d.income)
          const expH = barH(d.expenses)
          return (
            <g key={d.label}>
              {/* Income bar */}
              <rect
                x={x}
                y={chartH - incH}
                width={barW}
                height={incH}
                rx={2}
                fill="#4ade80"
                opacity={0.85}
              />
              {/* Expense bar */}
              <rect
                x={x + barW + gap}
                y={chartH - expH}
                width={barW}
                height={expH}
                rx={2}
                fill="#f87171"
                opacity={0.85}
              />
              {/* Month label */}
              <text
                x={x + barW + gap / 2}
                y={chartH + 14}
                textAnchor="middle"
                fontSize={9}
                fill="#9ca3af"
              >
                {d.label}
              </text>
              {/* Income value on hover via title */}
              <title>{d.label}: Income {fmt(d.income)} / Expenses {fmt(d.expenses)}</title>
            </g>
          )
        })}
      </svg>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-1 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-green-400" />
          <span className="text-xs text-zinc-500">Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-400" />
          <span className="text-xs text-zinc-500">Expenses</span>
        </div>
      </div>
    </div>
  )
}
