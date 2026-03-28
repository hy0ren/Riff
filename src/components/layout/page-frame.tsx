import { cn } from '@/lib/utils'

interface PageFrameProps {
  /** Page title displayed in the header */
  title?: string
  /** Optional subtitle or description */
  subtitle?: string
  /** Actions rendered on the right side of the header */
  actions?: React.ReactNode
  /** Content */
  children: React.ReactNode
  /** Additional CSS classes for the content wrapper */
  className?: string
  /** 
   * Full-bleed mode: no max-width or padding constraints.
   * Used by dense workspaces like Studio and Coach.
   */
  fullBleed?: boolean
  /**
   * Optional right-side inspector panel content.
   * When provided, splits the content area into main + inspector columns.
   */
  inspectorSlot?: React.ReactNode
  /** Width of the inspector panel in px. Defaults to 340. */
  inspectorWidth?: number
}

export function PageFrame({
  title,
  subtitle,
  actions,
  children,
  className,
  fullBleed = false,
  inspectorSlot,
  inspectorWidth = 340,
}: PageFrameProps) {
  const hasHeader = title || actions

  if (fullBleed) {
    return (
      <div className={cn('flex h-full flex-col', className)}>
        {hasHeader && (
          <div className="flex shrink-0 items-center justify-between px-6 pt-5 pb-4">
            <div>
              {title && (
                <h1 className="font-display text-lg font-semibold text-[var(--riff-text-primary)]">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-0.5 text-sm text-[var(--riff-text-muted)]">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        <div className="flex flex-1 flex-col overflow-hidden">
          {inspectorSlot ? (
            <div className="flex h-full">
              <div className="flex-1 overflow-y-auto">{children}</div>
              <aside
                className="shrink-0 overflow-y-auto riff-ghost-border"
                style={{
                  width: inspectorWidth,
                  background: 'var(--riff-surface-low)',
                  borderLeft: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {inspectorSlot}
              </aside>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('h-full overflow-y-auto', className)}>
      <div className="mx-auto w-full max-w-[1400px] px-8 py-6">
        {hasHeader && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              {title && (
                <h1 className="font-display text-xl font-semibold text-[var(--riff-text-primary)]">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-[var(--riff-text-muted)]">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}

        {inspectorSlot ? (
          <div className="flex gap-6">
            <div className="flex-1">{children}</div>
            <aside
              className="shrink-0 overflow-y-auto rounded-xl"
              style={{
                width: inspectorWidth,
                background: 'var(--riff-surface-low)',
              }}
            >
              {inspectorSlot}
            </aside>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
