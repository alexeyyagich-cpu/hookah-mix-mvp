export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded-lg skeleton" />
        <div className="h-10 w-32 rounded-xl skeleton" />
      </div>
      <div className="h-12 rounded-xl skeleton" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4 h-20 skeleton" />
        ))}
      </div>
    </div>
  )
}
