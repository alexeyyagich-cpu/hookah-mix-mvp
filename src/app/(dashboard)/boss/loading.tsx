export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-56 rounded-lg skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5 h-24 skeleton" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5 h-64 skeleton" />
        <div className="card p-5 h-64 skeleton" />
      </div>
    </div>
  )
}
