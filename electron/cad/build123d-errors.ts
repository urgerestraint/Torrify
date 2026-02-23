export function deriveBuild123dRenderError(stderrRaw: string, stdoutRaw: string, exitCode: number | null): string {
  const errorMessage = stderrRaw || stdoutRaw || `Python exited with code ${exitCode}`

  if (stderrRaw.includes('BUILD123D_NOT_INSTALLED')) {
    return 'build123d is not installed. Install it with: pip install build123d'
  }

  if (stderrRaw.includes('No exportable geometry found')) {
    return 'No exportable geometry found. Make sure your code creates a 3D object and assigns it to a variable.'
  }

  if (stderrRaw.includes('ModuleNotFoundError')) {
    const match = stderrRaw.match(/No module named '([^']+)'/)
    if (match) {
      return `Missing Python module: ${match[1]}. Make sure all required packages are installed.`
    }
  }

  return errorMessage
}
