import type { SVGProps } from 'react'
import type { ProjectVersion } from '@/domain/project'
import { Download, FileAudio, FileMusic, FileText, PackageOpen, CheckCircle2, Clock } from 'lucide-react'

interface ExportsTabProps {
  version: ProjectVersion
}

type MicIconProps = SVGProps<SVGSVGElement>

export function ExportsTab({ version }: ExportsTabProps) {
  if (!version.exports) {
    return <div className="p-8 text-center text-[var(--riff-text-muted)]">No export options currently available.</div>
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'audio': return <FileAudio className="h-6 w-6 text-emerald-500" />
      case 'instrumental': return <FileAudio className="h-6 w-6 text-amber-500" />
      case 'vocal': return <MicIcon className="h-6 w-6 text-purple-500" />
      case 'midi': return <FileMusic className="h-6 w-6 text-blue-500" />
      case 'chord_sheet': return <FileText className="h-6 w-6 text-slate-400" />
      case 'lyrics': return <FileText className="h-6 w-6 text-slate-400" />
      default: return <FileAudio className="h-6 w-6 text-slate-400" />
    }
  }

  return (
    <div className="flex flex-col gap-10 max-w-5xl">
      <div className="flex justify-between items-center mb-2">
        <div>
           <h2 className="font-display text-xl font-semibold tracking-wide text-[var(--riff-text-primary)]">Project Exports</h2>
           <p className="text-sm text-[var(--riff-text-muted)] mt-1">Download stems, metadata, and full bundles</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--riff-accent)] to-[var(--riff-accent-focus)] hover:from-[var(--riff-accent-light)] hover:to-[var(--riff-accent)] text-white shadow-[0_0_15px_rgba(18,117,226,0.3)] rounded-lg font-bold tracking-wide transition-all active:scale-95">
          <PackageOpen className="h-5 w-5 fill-current opacity-80" /> Download Full Bundle <span className="text-xs ml-1 font-mono font-normal opacity-80">(85MB)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {version.exports.map((exp, idx) => (
          <div key={idx} className="flex flex-col justify-between rounded-xl bg-[var(--riff-surface-low)] border border-[var(--riff-surface-highest)] p-6 hover:bg-[var(--riff-surface-high)] transition-colors group cursor-pointer relative overflow-hidden">
             
             {/* Gradient Hover Detail */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--riff-accent)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-[var(--riff-surface-highest)] flex items-center justify-center">
                    {getIcon(exp.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--riff-text-primary)] capitalize tracking-wide">{exp.type.replace('_', ' ')}</h3>
                    <p className="text-xs font-mono text-[var(--riff-text-secondary)] mt-0.5">{exp.size || '--'}</p>
                  </div>
                </div>
                {exp.status === 'ready' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 opacity-80" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-500 opacity-80" />
                )}
             </div>

             <div className="flex items-center justify-between border-t border-[var(--riff-surface-highest)] pt-4 mt-auto">
                <span className="text-[10px] uppercase text-[var(--riff-text-muted)] tracking-widest font-semibold">{exp.status}</span>
                <button className="text-[var(--riff-text-primary)] group-hover:text-[var(--riff-accent-light)] transition-colors">
                  <Download className="h-5 w-5" />
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MicIcon(props: MicIconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}
