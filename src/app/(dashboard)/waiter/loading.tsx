export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded-lg skeleton" />
        <div className="h-10 w-24 rounded-xl skeleton" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 h-20 skeleton" />
          ))}
        </div>
        <div className="card p-5 h-64 skeleton" />
      </div>
    </div>
  )
}
