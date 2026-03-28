import { Button } from '@/components/ui/button'
import type { RemixChainNode } from '@/domain/explore'
import { ArrowRight, Play, Wand2 } from 'lucide-react'

interface RemixChainProps {
  nodes: RemixChainNode[]
  onPlay: (id: string) => void
  onRemix: (id: string) => void
  onOpen: (id: string) => void
}

export function RemixChain({ nodes, onPlay, onRemix, onOpen }: RemixChainProps) {
  return (
    <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
      {nodes.map((node, index) => (
        <div key={node.id} className="flex shrink-0 items-center">
          {/* Node card */}
          <div
            className="group flex w-52 cursor-pointer flex-col overflow-hidden rounded-xl transition-colors hover:bg-[var(--riff-surface-mid)]"
            style={{ background: 'var(--riff-surface-low)', border: '1px solid rgba(255,255,255,0.04)' }}
            onClick={() => onOpen(node.id)}
          >
            <div className="relative">
              <img src={node.coverUrl} alt={node.title} className="h-32 w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  onClick={(e) => { e.stopPropagation(); onPlay(node.id) }}
                  className="h-9 w-9 rounded-full p-0"
                  style={{ background: 'var(--riff-accent)' }}
                >
                  <Play className="h-3.5 w-3.5 fill-current text-white" />
                </Button>
              </div>
              {/* Variation label */}
              <div className="absolute bottom-2 left-2">
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: index === 0 ? 'rgba(18,117,226,0.2)' : 'rgba(255,255,255,0.1)',
                    color: index === 0 ? 'var(--riff-accent-light)' : 'var(--riff-text-secondary)',
                    border: index === 0 ? '1px solid rgba(18,117,226,0.3)' : '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {node.variationLabel}
                </span>
              </div>
            </div>
            <div className="flex items-start justify-between gap-1 p-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[var(--riff-text-primary)]">{node.title}</p>
                <p className="mt-0.5 text-[11px] text-[var(--riff-text-muted)]">{node.creator}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onRemix(node.id) }}
                className="h-7 w-7 shrink-0 rounded-md text-[var(--riff-text-faint)] opacity-0 transition-opacity hover:text-[var(--riff-accent-light)] group-hover:opacity-100"
              >
                <Wand2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Connector */}
          {index < nodes.length - 1 && (
            <div className="flex shrink-0 items-center px-2">
              <div className="h-px w-4 border-t border-dashed border-[var(--riff-text-faint)]" />
              <ArrowRight className="h-3.5 w-3.5 text-[var(--riff-text-faint)]" />
              <div className="h-px w-4 border-t border-dashed border-[var(--riff-text-faint)]" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
