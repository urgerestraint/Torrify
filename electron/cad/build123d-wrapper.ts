function sanitizeUserCode(userCode: string): string {
  const safeUserCode = userCode.trim() || 'pass  # Empty user code'
  return safeUserCode.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function escapeOutputPath(outputPath: string): string {
  return outputPath.replace(/\\/g, '\\\\')
}

export function generateBuild123dWrapperScript(userCode: string, outputPath: string): string {
  const escapedOutputPath = escapeOutputPath(outputPath)
  const escapedUserCode = sanitizeUserCode(userCode)

  return `# Auto-generated wrapper script for build123d
import sys
import traceback

# Verify build123d is available and import export_stl for wrapper use
try:
    import build123d as _b123d_module
    from build123d import export_stl as _wrapper_export_stl
except ImportError as e:
    print("BUILD123D_NOT_INSTALLED", file=sys.stderr)
    sys.exit(1)

# Execute user code in its own namespace
_user_globals = {'__name__': '__main__', '__builtins__': __builtins__}
_user_code = '''
${escapedUserCode}
'''

try:
    exec(_user_code, _user_globals)
except Exception as e:
    print(f"ERROR in user code: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)

# Find and export geometry from user code namespace
def _get_exportable(obj):
    """Extract exportable geometry from an object"""
    if obj is None:
        return None
    # If it's a BuildPart context, get the .part property
    if hasattr(obj, 'part'):
        part_attr = getattr(obj, 'part')
        # .part is a property, just access it
        if hasattr(part_attr, 'wrapped'):
            return part_attr
        return None
    # If it already has .wrapped, it's exportable
    if hasattr(obj, 'wrapped'):
        return obj
    return None

try:
    _export_result = None
    
    # First, check for common variable names in user namespace
    for var_name in ['result', 'part', 'model', 'obj', 'shape', 'solid', 'box', 'cylinder', 'sphere']:
        if var_name in _user_globals:
            candidate = _user_globals[var_name]
            _export_result = _get_exportable(candidate)
            if _export_result is not None:
                break
    
    # If nothing found, search all user variables
    if _export_result is None:
        for name, obj in _user_globals.items():
            if name.startswith('_'):
                continue
            _export_result = _get_exportable(obj)
            if _export_result is not None:
                break
    
    if _export_result is None:
        print("ERROR: No exportable geometry found. Make sure your code creates a 3D object.", file=sys.stderr)
        print("Tip: Assign your geometry to a variable like 'result', 'part', or 'model'.", file=sys.stderr)
        sys.exit(1)
    
    # Export to STL using the wrapper's import
    _wrapper_export_stl(_export_result, "${escapedOutputPath}")
    print(f"Successfully exported to ${escapedOutputPath}")
    
except Exception as e:
    print(f"ERROR during export: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)
`
}
