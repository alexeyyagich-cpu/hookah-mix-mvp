export default function BarSalesLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 h-20 skeleton" />
        ))}
      </div>
      <div className="card p-6 h-48 skeleton" />
      <div className="card p-6 h-64 skeleton" />
    </div>
  )
}
