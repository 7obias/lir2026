import { useMemo, useState } from 'react'
import { useApp } from '../app/AppContext'
import { PrioritySelector } from '../components/PrioritySelector'
import { formatTime } from '../utils/schedule'
export function ArtistsPage() {
  const { data, setPriority } = useApp(); const [query, setQuery] = useState(''); const [genre, setGenre] = useState('all')
  const genres = [...new Set(data.artists.flatMap((a) => a.genres))].sort()
  const artists = useMemo(() => [...data.artists].filter((a) => a.name.toLowerCase().includes(query.toLowerCase()) && (genre === 'all' || a.genres.includes(genre))).sort((a, b) => a.name.localeCompare(b.name)), [data.artists, query, genre])
  const counts = (['must-see', 'interested', 'unselected', 'skip'] as const).map((p) => [p, data.performances.filter((perf) => (data.selections.find((s) => s.performanceId === perf.id)?.priority ?? 'unselected') === p).length] as const)
  return <section className="page"><header className="page-header"><div><p className="eyebrow">Discover & decide</p><h1>Artists</h1></div></header>
    <div className="summary-strip">{counts.map(([p, count]) => <div key={p}><strong>{count}</strong><span>{p === 'must-see' ? 'Must' : p === 'unselected' ? 'Open' : p}</span></div>)}</div>
    <div className="search-row"><label className="search"><span className="sr-only">Search artists</span><input type="search" placeholder="Search artists" value={query} onChange={(e) => setQuery(e.target.value)} /></label><select aria-label="Filter by genre" value={genre} onChange={(e) => setGenre(e.target.value)}><option value="all">All genres</option>{genres.map((g) => <option key={g}>{g}</option>)}</select></div>
    <div className="artist-list">{artists.map((artist) => <article className="artist-card" key={artist.id}><div className="avatar" aria-hidden="true">{artist.name.split(' ').map((v) => v[0]).join('').slice(0, 2)}</div><div className="artist-main"><h2>{artist.name}</h2><p>{artist.genres.join(' · ')}</p>
      {data.performances.filter((p) => p.artistId === artist.id).map((p) => { const stage = data.festival.stages.find((s) => s.id === p.stageId)?.name; const day = data.festival.days.find((d) => p.start.startsWith(d.date))?.label; const value = data.selections.find((s) => s.performanceId === p.id)?.priority ?? 'unselected'; return <div className="artist-set" key={p.id}><div><strong>{day}</strong><span>{formatTime(p.start)}–{formatTime(p.end)} · {stage}</span></div><PrioritySelector compact value={value} onChange={(next) => setPriority(p.id, next)} /></div>})}
    </div></article>)}</div>
  </section>
}
