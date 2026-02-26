export default function SessionsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="h-10 flex-1 rounded-lg skeleton" />
        <div className="h-10 w-32 rounded-lg skeleton" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4 h-24 skeleton" />
        ))}
      </div>
    </div>
  )
}
