import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectToolbar } from '../ProjectToolbar'

const defaultProps = {
  stlBase64: null as string | null,
  onSaveProject: vi.fn(),
  onLoadProject: vi.fn(),
  onExportScad: vi.fn(),
  onExportStl: vi.fn(),
  onOpenSettings: vi.fn()
}

describe('ProjectToolbar', () => {
  it('renders Save Project, Load Project, Export SCAD, Export STL, and Settings', () => {
    render(<ProjectToolbar {...defaultProps} />)
    expect(screen.getByRole('button', { name: /save project/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /load project/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export scad/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export stl/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
  })

  it('calls onSaveProject when Save Project is clicked', async () => {
    const user = userEvent.setup()
    const onSaveProject = vi.fn()
    render(<ProjectToolbar {...defaultProps} onSaveProject={onSaveProject} />)
    await user.click(screen.getByRole('button', { name: /save project/i }))
    expect(onSaveProject).toHaveBeenCalledTimes(1)
  })

  it('calls onLoadProject when Load Project is clicked', async () => {
    const user = userEvent.setup()
    const onLoadProject = vi.fn()
    render(<ProjectToolbar {...defaultProps} onLoadProject={onLoadProject} />)
    await user.click(screen.getByRole('button', { name: /load project/i }))
    expect(onLoadProject).toHaveBeenCalledTimes(1)
  })

  it('calls onExportScad when Export SCAD is clicked', async () => {
    const user = userEvent.setup()
    const onExportScad = vi.fn()
    render(<ProjectToolbar {...defaultProps} onExportScad={onExportScad} />)
    await user.click(screen.getByRole('button', { name: /export scad/i }))
    expect(onExportScad).toHaveBeenCalledTimes(1)
  })

  it('calls onExportStl when Export STL is clicked and stlBase64 is set', async () => {
    const user = userEvent.setup()
    const onExportStl = vi.fn()
    render(
      <ProjectToolbar {...defaultProps} onExportStl={onExportStl} stlBase64="base64data" />
    )
    await user.click(screen.getByRole('button', { name: /export stl/i }))
    expect(onExportStl).toHaveBeenCalledTimes(1)
  })

  it('disables Export STL when stlBase64 is null', () => {
    render(<ProjectToolbar {...defaultProps} />)
    expect(screen.getByRole('button', { name: /export stl/i })).toBeDisabled()
  })

  it('calls onOpenSettings when Settings is clicked', async () => {
    const user = userEvent.setup()
    const onOpenSettings = vi.fn()
    render(<ProjectToolbar {...defaultProps} onOpenSettings={onOpenSettings} />)
    await user.click(screen.getByRole('button', { name: /settings/i }))
    expect(onOpenSettings).toHaveBeenCalledTimes(1)
  })
})
