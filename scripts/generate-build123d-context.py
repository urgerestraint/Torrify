#!/usr/bin/env python3
"""
build123d Context Generator

Inspects the build123d library to generate a comprehensive API reference
for use by the LLM assistant.

Usage:
    python scripts/generate-build123d-context.py

Requirements:
    pip install build123d
"""

import sys
import inspect
from datetime import datetime
from typing import get_type_hints

def get_signature_safe(obj):
    """Safely get function/class signature."""
    try:
        sig = inspect.signature(obj)
        return str(sig)
    except (ValueError, TypeError):
        return "()"

def get_docstring_summary(obj):
    """Get first line of docstring."""
    doc = inspect.getdoc(obj)
    if doc:
        first_line = doc.split('\n')[0].strip()
        return first_line[:100] if len(first_line) > 100 else first_line
    return ""

def inspect_class(cls, indent=""):
    """Generate documentation for a class."""
    lines = []
    sig = get_signature_safe(cls)
    doc = get_docstring_summary(cls)
    
    lines.append(f"{indent}{cls.__name__}{sig}")
    if doc:
        lines.append(f"{indent}  # {doc}")
    
    return lines

def main():
    try:
        import build123d
    except ImportError:
        print("# build123d API Reference", file=sys.stderr)
        print("# Error: build123d not installed", file=sys.stderr)
        sys.exit(1)
    
    timestamp = datetime.now().isoformat()
    version = getattr(build123d, '__version__', 'unknown')
    
    output = []
    output.append(f"# build123d API Reference")
    output.append(f"# Generated: {timestamp}")
    output.append(f"# Version: {version}")
    output.append(f"# Source: Python introspection of build123d module")
    output.append("")
    
    # Categorize exports
    builders = []
    shapes_3d = []
    shapes_2d = []
    shapes_1d = []
    operations = []
    selectors = []
    locations = []
    planes_axes = []
    enums = []
    other = []
    
    # Get all public exports
    all_names = dir(build123d)
    public_names = [n for n in all_names if not n.startswith('_')]
    
    for name in sorted(public_names):
        try:
            obj = getattr(build123d, name)
            
            if not (inspect.isclass(obj) or inspect.isfunction(obj)):
                continue
            
            # Categorize based on name and type
            name_lower = name.lower()
            
            if 'build' in name_lower and inspect.isclass(obj):
                builders.append((name, obj))
            elif name in ['Box', 'Sphere', 'Cylinder', 'Cone', 'Torus', 'Wedge', 'Extrude', 'Revolve', 'Loft', 'Sweep']:
                shapes_3d.append((name, obj))
            elif name in ['Rectangle', 'Circle', 'Ellipse', 'Polygon', 'RegularPolygon', 'Text', 'Trapezoid', 'SlotArc', 'SlotOverall', 'SlotCenterPoint', 'SlotCenterToCenter']:
                shapes_2d.append((name, obj))
            elif name in ['Line', 'Polyline', 'Spline', 'Bezier', 'Arc', 'JernArc', 'RadiusArc', 'SagittaArc', 'TangentArc', 'ThreePointArc']:
                shapes_1d.append((name, obj))
            elif name_lower in ['extrude', 'revolve', 'loft', 'sweep', 'fillet', 'chamfer', 'offset', 'mirror', 'split', 'shell', 'thicken']:
                operations.append((name, obj))
            elif 'location' in name_lower:
                locations.append((name, obj))
            elif name in ['Plane', 'Axis', 'Vector', 'Location', 'Rotation']:
                planes_axes.append((name, obj))
            elif name in ['Align', 'Mode', 'Kind', 'Keep', 'Side', 'Transition', 'GeomType', 'SortBy', 'Select']:
                enums.append((name, obj))
            elif inspect.isclass(obj) and (hasattr(obj, 'faces') or hasattr(obj, 'edges') or hasattr(obj, 'vertices')):
                # Shape-like objects
                if 'Part' in name or 'Solid' in name:
                    shapes_3d.append((name, obj))
                elif 'Sketch' in name or 'Face' in name:
                    shapes_2d.append((name, obj))
                else:
                    other.append((name, obj))
            elif inspect.isfunction(obj):
                operations.append((name, obj))
            else:
                other.append((name, obj))
                
        except Exception as e:
            continue
    
    # Output builders
    if builders:
        output.append("## Builder Contexts")
        output.append("")
        for name, obj in builders:
            output.extend(inspect_class(obj))
        output.append("")
    
    # Output 3D shapes
    if shapes_3d:
        output.append("## 3D Shapes/Primitives")
        output.append("")
        for name, obj in shapes_3d:
            output.extend(inspect_class(obj))
        output.append("")
    
    # Output 2D shapes
    if shapes_2d:
        output.append("## 2D Shapes (Sketch Objects)")
        output.append("")
        for name, obj in shapes_2d:
            output.extend(inspect_class(obj))
        output.append("")
    
    # Output 1D shapes
    if shapes_1d:
        output.append("## 1D Shapes (Line/Wire Objects)")
        output.append("")
        for name, obj in shapes_1d:
            output.extend(inspect_class(obj))
        output.append("")
    
    # Output operations
    if operations:
        output.append("## Operations")
        output.append("")
        for name, obj in operations:
            if inspect.isfunction(obj):
                sig = get_signature_safe(obj)
                doc = get_docstring_summary(obj)
                output.append(f"{name}{sig}")
                if doc:
                    output.append(f"  # {doc}")
            else:
                output.extend(inspect_class(obj))
        output.append("")
    
    # Output locations
    if locations:
        output.append("## Location Helpers")
        output.append("")
        for name, obj in locations:
            output.extend(inspect_class(obj))
        output.append("")
    
    # Output planes/axes
    if planes_axes:
        output.append("## Planes, Axes, Vectors")
        output.append("")
        for name, obj in planes_axes:
            output.extend(inspect_class(obj))
        output.append("")
    
    # Output enums
    if enums:
        output.append("## Enums and Constants")
        output.append("")
        for name, obj in enums:
            if inspect.isclass(obj) and hasattr(obj, '__members__'):
                members = list(obj.__members__.keys())[:10]  # Limit to first 10
                output.append(f"{name}: {', '.join(members)}")
            else:
                output.extend(inspect_class(obj))
        output.append("")
    
    # Add usage patterns
    output.append("## Common Patterns")
    output.append("")
    output.append("### Semantic Selection (CRITICAL - Never use index-based selection)")
    output.append("part.faces().sort_by(Axis.Z).last  # Top face")
    output.append("part.edges().filter_by(Axis.Z)     # Vertical edges")
    output.append("part.faces().filter_by(GeomType.PLANE)  # Flat faces")
    output.append("part.edges().group_by(Axis.Z)[0]   # Bottom edge group")
    output.append("")
    output.append("### Builder Pattern")
    output.append("with BuildPart() as part:")
    output.append("    with BuildSketch(Plane.XY):")
    output.append("        Rectangle(width, height, align=(Align.CENTER, Align.CENTER))")
    output.append("    extrude(amount=depth)")
    output.append("result = part.part")
    output.append("")
    output.append("### Alignment")
    output.append("# Always use align parameter instead of manual centering math")
    output.append("Rectangle(w, h, align=(Align.CENTER, Align.CENTER))")
    output.append("Box(w, h, d, align=(Align.CENTER, Align.CENTER, Align.MIN))")
    output.append("")
    
    # Print to stdout (will be captured by Node.js)
    print('\n'.join(output))

if __name__ == '__main__':
    main()
