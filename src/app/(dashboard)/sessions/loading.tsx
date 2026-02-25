export default function SessionsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-4">
        <div className="h-10 flex-1 rounded-lg bg-[var(--color-surface)]" />
        <div className="h-10 w-32 rounded-lg bg-[var(--color-surface)]" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4 h-24 bg-[var(--color-surface)]" />
        ))}
      </div>
    </div>
  )
}
