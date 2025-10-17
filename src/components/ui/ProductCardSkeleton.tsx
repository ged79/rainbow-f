export default function ProductCardSkeleton() {
  return (
    <div className="bg-white overflow-hidden border border-neutral-100 animate-pulse">
      <div className="aspect-[4/5] bg-neutral-200" />
      <div className="p-4">
        <div className="h-4 bg-neutral-200 rounded mb-2" />
        <div className="h-3 bg-neutral-200 rounded mb-3 w-3/4" />
        <div className="h-5 bg-neutral-200 rounded w-1/2" />
      </div>
    </div>
  )
}