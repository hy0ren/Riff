import {
  Children,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

export interface StaggerChildrenProps {
  children: ReactNode
  /** Delay increase per child, in milliseconds */
  staggerMs?: number
  className?: string
}

function mergeChildProps(
  child: ReactElement<{ className?: string; style?: CSSProperties }>,
  index: number,
  staggerMs: number,
) {
  return cloneElement(child, {
    className: cn('stagger-child', child.props.className),
    style: {
      ...child.props.style,
      animationDelay: `${index * staggerMs}ms`,
    },
  })
}

/**
 * Applies a short staggered fade-in to each direct child (opacity + slight rise).
 * Children should be elements that accept `className` and `style` (e.g. cards, buttons).
 */
export function StaggerChildren({
  children,
  staggerMs = 55,
  className,
}: StaggerChildrenProps) {
  const mapped = Children.map(children, (child, index) => {
    if (!isValidElement(child)) return child
    return mergeChildProps(
      child as ReactElement<{ className?: string; style?: CSSProperties }>,
      index,
      staggerMs,
    )
  })

  if (className) {
    return <div className={className}>{mapped}</div>
  }

  return <>{mapped}</>
}
