export default function ShiftsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="card p-6 h-32 bg-[var(--color-surface)]" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card p-4 h-20 bg-[var(--color-surface)]" />
        ))}
      </div>
    </div>
  )
}
