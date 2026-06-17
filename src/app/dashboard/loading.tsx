export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-lg bg-muted" />
          <div className="h-4 w-72 rounded bg-muted" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-muted" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card h-24 p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="space-y-2 flex-1">
                <div className="h-6 w-16 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-4 space-y-4">
        <div className="h-10 w-full max-w-md rounded-lg bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted/70" />
          ))}
        </div>
      </div>
    </div>
  );
}
