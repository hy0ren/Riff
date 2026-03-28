import type { InterpretationConflict, InterpretationSignal, InterpretationSnapshot } from '@/domain/interpretation'

export function getSafeInterpretationSignals(
  interpretation: Partial<InterpretationSnapshot> | undefined,
): InterpretationSignal[] {
  return interpretation?.signals ?? []
}

export function getSafeInterpretationConflicts(
  interpretation: Partial<InterpretationSnapshot> | undefined,
): InterpretationConflict[] {
  return interpretation?.conflicts ?? []
}

export function getSafeDerivedBlueprint(
  interpretation: Partial<InterpretationSnapshot> | undefined,
): InterpretationSnapshot['derivedBlueprint'] {
  return interpretation?.derivedBlueprint ?? {}
}

export function normalizeInterpretationSnapshot(
  interpretation: InterpretationSnapshot | undefined,
): InterpretationSnapshot | undefined {
  if (!interpretation) {
    return undefined
  }

  return {
    ...interpretation,
    summary: interpretation.summary ?? 'No interpretation available.',
    sourceInputIds: interpretation.sourceInputIds ?? [],
    derivedBlueprint: getSafeDerivedBlueprint(interpretation),
    signals: getSafeInterpretationSignals(interpretation),
    conflicts: getSafeInterpretationConflicts(interpretation),
  }
}
