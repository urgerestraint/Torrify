import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, act } from '@testing-library/react'
import { ParameterPanel } from '../ParameterPanel'

describe('ParameterPanel', () => {
  const baseCode = `// ==========================================
// CONFIGURATION (Editable Parameters)
// ==========================================
width_mm = 100; // Width
enabled = true;
label = "demo";
smoothness = $preview ? 32 : 128;

// ==========================================
// IMPLEMENTATION
// ==========================================
cube([width_mm, 20, 10]);
`

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows empty state when no editable parameters exist', () => {
    render(
      <ParameterPanel
        code={'cube([10, 20, 30]);'}
        cadBackend="openscad"
        onChange={vi.fn()}
      />
    )

    expect(screen.getByText('No parameters detected')).toBeInTheDocument()
  })

  it('updates numeric parameters from slider and debounces onRender', async () => {
    const onChange = vi.fn()
    const onRender = vi.fn()

    render(
      <ParameterPanel
        code={baseCode}
        cadBackend="openscad"
        onChange={onChange}
        onRender={onRender}
      />
    )

    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '120' } })

    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.lastCall?.[0]).toContain('width_mm = 120;')

    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    expect(onRender).toHaveBeenCalledTimes(1)
  })

  it('clamps manual number input to max absolute input value', () => {
    const onChange = vi.fn()

    render(
      <ParameterPanel
        code={baseCode}
        cadBackend="openscad"
        onChange={onChange}
      />
    )

    const numericInputs = screen.getAllByRole('spinbutton')
    fireEvent.change(numericInputs[0], { target: { value: '20000' } })

    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.lastCall?.[0]).toContain('width_mm = 10000;')
  })

  it('updates boolean and string parameters', () => {
    const onChange = vi.fn()

    render(
      <ParameterPanel
        code={baseCode}
        cadBackend="openscad"
        onChange={onChange}
      />
    )

    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    expect(onChange.mock.lastCall?.[0]).toContain('enabled = false;')

    const textInput = screen.getByDisplayValue('demo')
    fireEvent.change(textInput, { target: { value: 'updated' } })
    expect(onChange.mock.lastCall?.[0]).toContain('label = "updated";')
  })

  it('renders expression parameters as read-only values', () => {
    render(
      <ParameterPanel
        code={baseCode}
        cadBackend="openscad"
        onChange={vi.fn()}
      />
    )

    expect(screen.getByText('smoothness')).toBeInTheDocument()
    expect(screen.getByText('$preview ? 32 : 128')).toBeInTheDocument()
  })
})
