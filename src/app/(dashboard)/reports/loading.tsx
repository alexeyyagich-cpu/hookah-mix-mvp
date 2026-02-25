export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-4 h-24 bg-[var(--color-surface)]" />
        ))}
      </div>
      <div className="card p-6 h-64 bg-[var(--color-surface)]" />
      <div className="card p-6 h-48 bg-[var(--color-surface)]" />
    </div>
  )
}
