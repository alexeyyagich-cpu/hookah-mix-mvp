export default function InventoryLoading() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="h-10 flex-1 rounded-lg skeleton" />
        <div className="h-10 w-32 rounded-lg skeleton" />
      </div>
      <div className="card overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-[var(--color-border)] skeleton" />
        ))}
      </div>
    </div>
  )
}
