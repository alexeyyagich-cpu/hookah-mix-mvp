export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 rounded-lg skeleton" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card p-4 h-24 skeleton" />
        ))}
      </div>
    </div>
  )
}
