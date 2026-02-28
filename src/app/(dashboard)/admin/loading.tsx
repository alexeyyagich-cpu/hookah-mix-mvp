export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded-lg skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card p-5 h-28 skeleton" />
        ))}
      </div>
      <div className="card p-5 h-64 skeleton" />
    </div>
  )
}
