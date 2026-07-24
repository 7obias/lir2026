type SearchablePerformance = {
  id: string
  artist: string
  stageId: string
  displayTitle?: string
}

type SearchableStage = {
  id: string
  name: string
}

export const normalizeTimetableSearch = (query: string) => query.trim().toLocaleLowerCase()

export const matchingPerformanceIds = (
  performances: readonly SearchablePerformance[],
  stages: readonly SearchableStage[],
  query: string,
) => {
  const normalizedQuery = normalizeTimetableSearch(query)
  if (!normalizedQuery) return new Set<string>()

  const stageNames = new Map(stages.map((stage) => [stage.id, stage.name.toLocaleLowerCase()]))
  return new Set(performances.filter((performance) => (
    performance.artist.toLocaleLowerCase().includes(normalizedQuery)
    || performance.displayTitle?.toLocaleLowerCase().includes(normalizedQuery)
    || stageNames.get(performance.stageId)?.includes(normalizedQuery)
  )).map(({ id }) => id))
}
