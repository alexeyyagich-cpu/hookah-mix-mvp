export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded-lg skeleton" />
        <div className="h-10 w-32 rounded-xl skeleton" />
      </div>
      <div className="card h-[60vh] skeleton" />
    </div>
  )
}
