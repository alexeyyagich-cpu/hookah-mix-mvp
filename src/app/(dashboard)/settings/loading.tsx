export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 rounded-lg skeleton" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-5 h-32 skeleton" />
      ))}
    </div>
  )
}
