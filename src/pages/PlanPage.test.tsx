import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppProvider } from '../app/AppContext'
import { PlanPage } from './PlanPage'
import { PrioritySelector } from '../components/PrioritySelector'
vi.mock('../db/repository', async () => {
  const actual = await vi.importActual('../db/repository')
  return { ...actual, repository: { initialize: vi.fn(() => Promise.reject()), load: vi.fn(), saveSelection: vi.fn(), deleteSelection: vi.fn() } }
})
describe('planning UI', () => {
  it('shows an empty state', async () => { render(<AppProvider><PlanPage /></AppProvider>); expect(await screen.findByText('Your plan is wide open')).toBeInTheDocument() })
  it('supports priority selection interaction', async () => { const onChange=vi.fn(); render(<PrioritySelector value="unselected" onChange={onChange} />); await userEvent.click(screen.getByRole('button',{name:/Must see/})); expect(onChange).toHaveBeenCalledWith('must-see') })
})
