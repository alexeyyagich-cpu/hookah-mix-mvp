export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded-lg skeleton" />
        <div className="flex gap-2">
          <div className="h-10 w-24 rounded-xl skeleton" />
          <div className="h-10 w-24 rounded-xl skeleton" />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, col) => (
          <div key={col} className="space-y-3">
            <div className="h-6 w-24 rounded skeleton" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-4 h-32 skeleton" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
