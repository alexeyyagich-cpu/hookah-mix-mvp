export default function ShiftsLoading() {
  return (
    <div className="space-y-6">
      <div className="card p-6 h-32 skeleton" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card p-4 h-20 skeleton" />
        ))}
      </div>
    </div>
  )
}
