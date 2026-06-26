import { cn } from '@/utils/cn';

/**
 * Text skeleton — single line
 */
export function SkeletonText({ width = '100%', height = '14px', className = '' }) {
  return (
    <div
      className={cn('skeleton', className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton for stat cards
 */
export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={cn('card-no-hover', className)}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between mb-4">
        <SkeletonText width="120px" height="12px" />
        <SkeletonText width="32px" height="32px" className="rounded-lg" />
      </div>
      <SkeletonText width="80px" height="28px" className="mb-2" />
      <SkeletonText width="100px" height="12px" />
    </div>
  );
}

/**
 * Skeleton for table rows
 */
export function SkeletonRow({ cols = 5 }) {
  const widths = ['180px', '120px', '100px', '80px', '60px'];
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <SkeletonText width={widths[i % widths.length]} height="13px" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Generic avatar skeleton
 */
export function SkeletonAvatar({ size = 32 }) {
  return (
    <div
      className="skeleton rounded-full flex-shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

/**
 * Full page skeleton (for initial page loads)
 */
export function SkeletonPage() {
  return (
    <div className="space-y-6 animate-fade-in" aria-busy="true" aria-label="Loading...">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Content area */}
      <div className="card-no-hover space-y-4">
        <SkeletonText width="200px" height="18px" />
        <table className="data-table">
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} cols={6} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
