import { useCallback, useRef, useMemo } from 'react'
import { extractParameters, updateParameterInCode } from '../services/parameters'
import type { CADBackend } from '../services/cad'
import type { ExtractedParameter } from '../services/parameters'

interface ParameterPanelProps {
  readonly code: string
  readonly cadBackend: CADBackend
  readonly onChange: (code: string) => void
  readonly onRender?: () => void
}

/** Max value for manual number input */
const MAX_INPUT_VALUE = 10000

/**
 * Computes slider range from the INITIAL default value (not the current value).
 * This prevents the range from growing as users adjust the slider.
 */
function getSliderRange(defaultVal: number, param: ExtractedParameter): { min: number; max: number } {
  if (param.min != null && param.max != null) {
    return { min: param.min, max: param.max }
  }
  return { min: 0, max: Math.abs(defaultVal) * 2 }
}

function clampNumber(value: number, min: number, max: number): number {
  if (value !== value) return min
  return Math.min(Math.max(value, min), max)
}

function ParameterControl({
  param,
  code,
  defaultValues,
  onChange,
  onRender
}: {
  param: ExtractedParameter
  code: string
  defaultValues: Record<string, number>
  onChange: (code: string) => void
  onRender?: () => void
}) {
  const renderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback(
    (newValue: number | boolean | string) => {
      const updated = updateParameterInCode(code, param, newValue)
      onChange(updated)
      if (onRender) {
        if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current)
        renderTimeoutRef.current = setTimeout(() => {
          renderTimeoutRef.current = null
          onRender()
        }, 500)
      }
    },
    [param, code, onChange, onRender]
  )

  if (param.type === 'expression') {
    return (
      <div className="py-2">
        <label className="block text-xs text-gray-500 mb-1 font-mono">{param.name}</label>
        <span className="inline-block px-2 py-1 bg-[#2d2d30] rounded text-sm text-gray-400 font-mono">
          {param.rawValue}
        </span>
        {param.comment && <p className="text-xs text-gray-500 mt-1">{param.comment}</p>}
      </div>
    )
  }

  if (param.type === 'boolean') {
    const checked = param.value as boolean
    return (
      <div className="py-2 flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-300">{param.displayName}</label>
          {param.comment && <p className="text-xs text-gray-500">{param.comment}</p>}
        </div>
        <button
          role="switch"
          aria-checked={checked}
          onClick={() => handleChange(!checked)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors ${
            checked ? 'bg-blue-600' : 'bg-gray-600'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
            style={{ top: '4px' }}
          />
        </button>
      </div>
    )
  }

  if (param.type === 'string') {
    const val = param.value as string
    return (
      <div className="py-2">
        <label className="block text-sm font-medium text-gray-300 mb-1">{param.displayName}</label>
        <input
          type="text"
          value={val}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full px-3 py-2 bg-[#2d2d30] border border-[#3e3e42] rounded text-sm text-white focus:border-blue-500 focus:outline-none"
        />
        {param.comment && <p className="text-xs text-gray-500 mt-1">{param.comment}</p>}
      </div>
    )
  }

  if (param.type === 'number') {
    const val = param.value as number
    const { min, max } = getSliderRange(defaultValues[param.name] ?? val, param)
    const step = Number.isInteger(defaultValues[param.name] ?? val) ? 1 : 0.01
    
    // Clamp slider display to its range, but allow number input to go beyond
    const sliderVal = clampNumber(val, min, max)
    // Number input shows actual value, clamped to input limits
    const inputVal = clampNumber(val, -MAX_INPUT_VALUE, MAX_INPUT_VALUE)
    
    return (
      <div className="py-2">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-300">{param.displayName}</label>
          {param.unit && (
            <span className="text-xs text-gray-500">{param.unit}</span>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={sliderVal}
            onChange={(e) => handleChange(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-[#2d2d30] rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <input
            type="number"
            step={step}
            value={inputVal}
            onChange={(e) => {
              const n = parseFloat(e.target.value)
              if (!Number.isNaN(n)) {
                // Allow any value up to input limits, not restricted to slider range
                handleChange(clampNumber(n, -MAX_INPUT_VALUE, MAX_INPUT_VALUE))
              }
            }}
            className="w-20 px-2 py-1 bg-[#2d2d30] border border-[#3e3e42] rounded text-sm text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        {param.comment && <p className="text-xs text-gray-500 mt-1">{param.comment}</p>}
      </div>
    )
  }

  return null
}

export function ParameterPanel({ code, cadBackend, onChange, onRender }: ParameterPanelProps) {
  const params = extractParameters(code, { backend: cadBackend })

  // Capture the FIRST set of numeric values as the defaults for slider ranges.
  // These don't change when the user adjusts sliders, preventing range drift.
  const defaultValuesRef = useRef<Record<string, number> | null>(null)
  const defaultValues = useMemo(() => {
    if (defaultValuesRef.current === null && params.length > 0) {
      const defaults: Record<string, number> = {}
      for (const p of params) {
        if (p.type === 'number') {
          defaults[p.name] = p.value as number
        }
      }
      defaultValuesRef.current = defaults
    }
    return defaultValuesRef.current ?? {}
  }, [params])

  if (params.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <svg
          className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h7"
          />
        </svg>
        <p className="text-gray-400 mb-2">No parameters detected</p>
        <p className="text-sm text-gray-500 max-w-xs">
          Use the Code Editor to add a CONFIGURATION (Editable Parameters) block at the top of your
          file. The AI will generate code in this format by default.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-4 space-y-1">
      {params.map((param) => (
        <div
          key={param.name}
          className="border-b border-[#3e3e42] last:border-b-0"
        >
          <ParameterControl
            param={param}
            code={code}
            defaultValues={defaultValues}
            onChange={onChange}
            onRender={onRender}
          />
        </div>
      ))}
    </div>
  )
}
