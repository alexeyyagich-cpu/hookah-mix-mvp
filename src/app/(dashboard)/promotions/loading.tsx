export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded-lg skeleton" />
        <div className="h-10 w-32 rounded-xl skeleton" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5 h-40 skeleton" />
        ))}
      </div>
    </div>
  )
}
