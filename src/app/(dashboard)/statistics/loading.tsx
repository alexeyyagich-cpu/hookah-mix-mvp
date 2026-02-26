export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded-lg skeleton" />
        <div className="flex gap-2">
          <div className="h-10 w-24 rounded-xl skeleton" />
          <div className="h-10 w-24 rounded-xl skeleton" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 h-20 skeleton" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5 h-72 skeleton" />
        <div className="card p-5 h-72 skeleton" />
      </div>
    </div>
  )
}
