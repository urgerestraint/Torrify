#!/usr/bin/env node
/**
 * Context Generator Script
 * 
 * Generates API definition files for OpenSCAD and build123d to provide
 * high-quality context to the LLM assistant.
 * 
 * Usage:
 *   node scripts/generate-context.cjs [--openscad] [--build123d] [--all] [--no-gemini]
 *
 * Optional LLM condense step (reduces context size for lower token use):
 *   Set OPENROUTER_API_KEY (preferred; same as in the app) or GEMINI_API_KEY. Use --no-gemini to skip.
 *   Model: OPENROUTER_MODEL or GEMINI_MODEL (e.g. google/gemini-2.0-flash). Default: google/gemini-2.0-flash.
 *
 * Dependencies:
 *   npm install cheerio node-fetch
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Output directory
const RESOURCES_DIR = path.join(__dirname, '..', 'resources');

// Ensure resources directory exists
if (!fs.existsSync(RESOURCES_DIR)) {
    fs.mkdirSync(RESOURCES_DIR, { recursive: true });
}

// --- Gemini condense prompts (goal: high-quality, ~60% smaller context) ---

const BUILD123D_CONDENSE_PROMPT = `I have a raw introspection dump of the Python library \`build123d\`. I need you to refactor this into a "Context Guide" optimized for an LLM to read and generate code from.

Please process the input using the following STRICT rules:

1.  **Aggressive Noise Stripping:**
    * Remove ALL citation tags like \`<...>\`, \`</...>\`, etc.
    * Remove timestamps, docstrings, and standard Python boilerplate (\`dataclass\`, \`cast\`, \`abstractmethod\`).
    * Do NOT include any introduction or conclusion text. Output ONLY the Python code block.

2.  **Remove Internals:**
    * COMPLETELY REMOVE any classes starting with \`BRep\`, \`TopoDS\`, \`TopLoc\`, or \`OCP\`.

3.  **Simplify Signatures:**
    * Keep argument names and defaults (e.g., \`radius=1.0\`).
    * Remove verbose type hints. Change \`align: 'Align | tuple...'\` to just \`align=(Align.CENTER, Align.CENTER)\`.

4.  **Structure & Enums (Mandatory):**
    * **Section 1: Concepts:** briefly list Context Managers, Algebra (\`+\`, \`-\`, \`&\`), and Selectors.
    * **Section 2: API Reference:**
        * **Enums:** You MUST explicitly define \`Mode\`, \`Align\`, \`Transition\`, and \`Side\` as Enums at the top of this section so the LLM knows valid options.
        * **Builders:** (BuildPart, BuildSketch, BuildLine).
        * **3D / 2D / 1D Objects.**
        * **Operations.**
    * **Section 3: Patterns (The Grammar):** You MUST append a section at the end showing idiomatic usage.
        * Show a \`BuildPart\` containing a \`BuildSketch\`.
        * Show the "Selector Pattern": \`p.faces().sort_by(Axis.Z).last\`.

5.  **Clarify Selectors:** Explicitly warn against using list indices (e.g., \`faces()[0]\`) and encourage \`.sort_by()\` or \`.filter_by()\`.

**Goal:** A clean, dense API reference that includes the *grammar* of how to nest these functions.

RAW CONTENT FOLLOWS (between the lines ---):
---
`;

const OPENSCAD_CONDENSE_PROMPT = `I have a raw, messy documentation dump of \`OpenSCAD\`. I need you to refactor this into a "Context Guide" optimized for an LLM to read and generate code from.

Please process the input using the following STRICT rules:

1.  **Aggressive Noise Stripping:**
    * Remove ALL citation tags like \`<...>\`, \`</...>\`.
    * Remove any Intro/Outro text. Output ONLY the code block.
    * **Critical:** The source tags are currently breaking code logic (e.g., inside \`{}\`). Ensure the final code is syntactically valid OpenSCAD.

2.  **Structure (Mandatory Sections):**
    * **Special Variables:** ($fn, $t, $children).
    * **3D Primitives:** (cube, sphere, cylinder, polyhedron).
    * **2D Primitives:** (square, circle, polygon, text).
    * **Boolean (CSG):** (union, difference, intersection).
    * **Transforms:** (translate, rotate, scale, resize, mirror, offset).
    * **High-Level:** (hull, minkowski, linear_extrude, rotate_extrude).
    * **Logic & Loops:** (for, intersection_for, if, let).
    * **Modifiers:** (*, !, #, %).

3.  **Inject Missing Knowledge (Crucial):**
    * **List Comprehensions:** You MUST add a section explaining \`[ for (i = range) i ]\` usage, which is missing from the source.
    * **Vector Math:** Briefly note that standard operators (+, -, *) work on vectors (e.g., \`[1,1] + [2,2]\`).

4.  **Add "Patterns" Section (The Grammar):**
    * At the end, add a section showing common idiomatic usage:
        * **2D to 3D:** \`linear_extrude(10) circle(5);\`
        * **Subtract Pattern:** \`difference() { Body(); Hole(); }\`
        * **Negative Space:** \`translate([0,0,-0.1])\` (for clean previews).

**Goal:** A dense, copy-pasteable syntax guide that includes the "grammar" of nesting and list comprehensions.

RAW CONTENT FOLLOWS (between the lines ---):
---
`;

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

/** Extract text from OpenRouter/OpenAI-style message content (string or array of { text }). */
function extractMessageContent(content) {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content.map((part) => (part && typeof part.text === 'string' ? part.text : '')).join('').trim();
    }
    return '';
}

/**
 * Condense raw context with an LLM to reduce token use while keeping quality.
 * Prefers OPENROUTER_API_KEY (OpenRouter); falls back to GEMINI_API_KEY (Google SDK).
 * Model: OPENROUTER_MODEL or GEMINI_MODEL. Default: google/gemini-2.0-flash.
 * @param {string} rawContent - Raw context text
 * @param {string} promptPrefix - Instruction prompt ending with "---"
 * @param {string} label - For log messages (e.g. 'OpenSCAD', 'build123d')
 * @returns {Promise<string|null>} Condensed text or null on skip/failure
 */
function getCondenseApiKey() {
    const openRouter = process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim();
    const gemini = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
    if (openRouter) return { type: 'openrouter', key: openRouter };
    if (gemini) return { type: 'gemini', key: gemini };
    return null;
}

async function condenseWithLLM(rawContent, promptPrefix, label) {
    const creds = getCondenseApiKey();
    if (!creds) return null;
    const openRouterKey = creds.type === 'openrouter' ? creds.key : null;
    const geminiKey = creds.type === 'gemini' ? creds.key : null;

    const modelName = process.env.OPENROUTER_MODEL || process.env.GEMINI_MODEL || 'google/gemini-2.0-flash';
    const fullPrompt = promptPrefix + rawContent;

    if (openRouterKey) {
        try {
            const fetch = (await import('node-fetch')).default;
            console.log(`  🤖 Condensing ${label} context with OpenRouter (${modelName})...`);
            const response = await fetch(OPENROUTER_ENDPOINT, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${openRouterKey}`,
                    'Content-Type': 'application/json',
                    'X-Title': 'Torrify'
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [{ role: 'user', content: fullPrompt }],
                    temperature: 0.3,
                    max_tokens: 16384
                })
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`OpenRouter ${response.status}: ${errText || response.statusText}`);
            }
            const data = await response.json();
            const text = extractMessageContent(data?.choices?.[0]?.message?.content);
            if (text && text.trim()) {
                console.log(`  ✅ Condensed ${label} context`);
                return text.trim();
            }
            console.warn(`  ⚠️ OpenRouter returned empty response for ${label}, using raw content`);
            return null;
        } catch (err) {
            console.error(`  ❌ OpenRouter condense failed (${label}): ${err.message}`);
            return null;
        }
    }

    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        console.log(`  🤖 Condensing ${label} context with Gemini (${modelName})...`);
        const result = await model.generateContent(fullPrompt);
        const text = result.response && result.response.text();
        if (text && text.trim()) {
            console.log(`  ✅ Condensed ${label} context`);
            return text.trim();
        }
        console.warn(`  ⚠️ Gemini returned empty response for ${label}, using raw content`);
        return null;
    } catch (err) {
        console.error(`  ❌ Gemini condense failed (${label}): ${err.message}`);
        return null;
    }
}

/**
 * Generate OpenSCAD context by scraping the official cheatsheet.
 * @param {{ skipGemini?: boolean }} options - skipGemini: skip Gemini condense step even if GEMINI_API_KEY is set
 */
async function generateOpenSCADContext(options = {}) {
    const { skipGemini = false } = options;
    console.log('📦 Generating OpenSCAD context...');
    
    let content;
    const outputPath = path.join(RESOURCES_DIR, 'context_openscad.txt');
    try {
        // Dynamic import for ES modules
        const cheerio = await import('cheerio');
        const fetch = (await import('node-fetch')).default;
        
        const CHEATSHEET_URL = 'https://openscad.org/cheatsheet/';
        
        console.log(`  Fetching ${CHEATSHEET_URL}...`);
        const response = await fetch(CHEATSHEET_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Extract function definitions from the cheatsheet
        const functions = [];
        const modules = [];
        const specialVars = [];
        
        // The cheatsheet uses specific classes for code examples
        $('span.exo-code, code, .function, .module').each((_, el) => {
            const text = $(el).text().trim();
            if (text && text.length > 2) {
                // Categorize based on content
                if (text.startsWith('$')) {
                    if (!specialVars.includes(text)) specialVars.push(text);
                } else if (text.includes('(')) {
                    if (!functions.includes(text)) functions.push(text);
                }
            }
        });
        
        // Also extract from any pre/code blocks
        $('pre, .cheatsheet-item').each((_, el) => {
            const text = $(el).text().trim();
            const lines = text.split('\n').filter(l => l.trim());
            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed.includes('(') && !trimmed.startsWith('//') && !trimmed.startsWith('#')) {
                    if (!functions.includes(trimmed) && trimmed.length < 200) {
                        functions.push(trimmed);
                    }
                }
            });
        });
        
        // Build the context file
        content = buildOpenSCADContextContent(functions, specialVars);
        console.log(`  📊 Found ${functions.length} functions, ${specialVars.length} special variables`);
    } catch (error) {
        console.error(`  ❌ Error generating OpenSCAD context: ${error.message}`);
        console.log('  📋 Using static fallback content...');
        content = getOpenSCADFallbackContent();
    }
    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`  ✅ Saved to ${outputPath}`);
    // Optional: condense with LLM to reduce token use
    if (!skipGemini && getCondenseApiKey()) {
        const condensed = await condenseWithLLM(content, OPENSCAD_CONDENSE_PROMPT, 'OpenSCAD');
        if (condensed) {
            fs.writeFileSync(outputPath, condensed, 'utf-8');
            console.log(`  ✅ Replaced with condensed context`);
        }
    }
    return true;
}

/**
 * Build formatted OpenSCAD context content
 */
function buildOpenSCADContextContent(functions, specialVars) {
    const timestamp = new Date().toISOString();
    
    return `# OpenSCAD API Reference
# Generated: ${timestamp}
# Source: https://openscad.org/cheatsheet/

## Special Variables
${specialVars.map(v => `- ${v}`).join('\n')}

## 2D Primitives
circle(r|d)
square(size, center)
polygon(points, paths)
text(text, size, font, halign, valign, spacing, direction, language, script)

## 3D Primitives
sphere(r|d)
cube(size, center)
cylinder(h, r|d, r1|d1, r2|d2, center)
polyhedron(points, faces, convexity)

## Transformations
translate(v)
rotate(a, v)
scale(v)
resize(newsize, auto)
mirror(v)
multmatrix(m)
color(c, alpha)
offset(r|delta, chamfer)
hull()
minkowski()

## Boolean Operations
union()
difference()
intersection()

## Modifiers
* - disable
! - show only
# - highlight/debug
% - transparent/background

## Control Flow
for (variable = [start : increment : end]) { ... }
for (variable = [value1, value2, ...]) { ... }
if (condition) { ... } else { ... }
let (assignments) expression
intersection_for(variable = [values]) { ... }

## Mathematical Functions
abs(x)
sign(x)
sin(x), cos(x), tan(x)
asin(x), acos(x), atan(x), atan2(y, x)
floor(x), ceil(x), round(x)
ln(x), log(x), exp(x), pow(base, exp)
sqrt(x)
min(values), max(values)
norm(v), cross(v1, v2)

## String Functions
str(values)
chr(number)
ord(string)
len(string|array)
search(match, string|array, num_returns, index_col)

## Type Functions
is_undef(x), is_bool(x), is_num(x), is_string(x), is_list(x), is_function(x)

## List Operations
concat(lists)
lookup(value, table)

## Special Variables
$fa - minimum angle for circle fragments
$fs - minimum size of circle fragments  
$fn - number of circle fragments (overrides $fa and $fs)
$t - animation time (0 to 1)
$vpr - viewport rotation
$vpt - viewport translation
$vpd - viewport distance
$vpf - viewport field of view
$children - number of child modules
$preview - true in preview mode, false when rendering

## Modules
module name(parameters) { ... }
children()
children(index)
children([start : step : end])

## Functions
function name(parameters) = expression;

## Import/Export
import(file, convexity)
surface(file, center, convexity)
render(convexity)
projection(cut)

## Echo and Assert
echo(values)
assert(condition, message)

## BOSL2 Library (Recommended)
# If using BOSL2, prefer these patterns:
include <BOSL2/std.scad>
up(z), down(z), left(x), right(x), fwd(y), back(y)
attach(anchor, spin, orient)
position(anchor)
reorient(anchor, spin, orient)
`;
}

/**
 * Static fallback content for OpenSCAD
 */
function getOpenSCADFallbackContent() {
    return buildOpenSCADContextContent([], ['$fn', '$fa', '$fs', '$t', '$preview', '$children']);
}

/**
 * Generate build123d context by running Python introspection.
 * @param {{ skipGemini?: boolean }} options - skipGemini: skip Gemini condense step even if GEMINI_API_KEY is set
 */
async function generateBuild123dContext(options = {}) {
    const { skipGemini = false } = options;
    console.log('🐍 Generating build123d context...');
    
    const pythonScript = path.join(__dirname, 'generate-build123d-context.py');
    const outputPath = path.join(RESOURCES_DIR, 'context_build123d.txt');
    let content;
    try {
        content = execSync(`python "${pythonScript}"`, {
            encoding: 'utf-8',
            timeout: 60000,
            stdio: ['pipe', 'pipe', 'pipe']
        });
    } catch (error) {
        console.error(`  ❌ Error running Python script: ${error.message}`);
        console.log('  📋 Using static fallback content...');
        content = getBuild123dFallbackContent();
    }
    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`  ✅ Saved to ${outputPath}`);
    // Optional: condense with LLM to reduce token use
    if (!skipGemini && getCondenseApiKey()) {
        const condensed = await condenseWithLLM(content, BUILD123D_CONDENSE_PROMPT, 'build123d');
        if (condensed) {
            fs.writeFileSync(outputPath, condensed, 'utf-8');
            console.log(`  ✅ Replaced with condensed context`);
        }
    }
    return true;
}

/**
 * Static fallback content for build123d
 */
function getBuild123dFallbackContent() {
    const timestamp = new Date().toISOString();
    
    return `# build123d API Reference
# Generated: ${timestamp}
# Source: Static fallback (Python introspection not available)

## Imports (CRITICAL - Must import everything you use!)
# NEVER use: from build123d import *
# ALWAYS explicitly import every class/function:
from build123d import (
    BuildPart, BuildSketch, BuildLine,
    Plane, Axis, Align, Mode, GeomType,
    Box, Cylinder, Sphere, Rectangle, Circle,
    extrude, fillet, chamfer, offset, make_face,
    Locations, GridLocations,
)

## Builder Contexts

### BuildPart() - 3D Part Builder
with BuildPart() as part:
    Box(length, width, height)
    Cylinder(radius, height, arc_size=360)
    Sphere(radius)
    Cone(bottom_radius, top_radius, height)
    Torus(major_radius, minor_radius)
    Wedge(dx, dy, dz, xmin, zmin, xmax, zmax)

### BuildSketch(plane) - 2D Sketch Builder
with BuildSketch(Plane.XY) as sketch:
    Rectangle(width, height, align=(Align.CENTER, Align.CENTER))
    Circle(radius)
    Ellipse(x_radius, y_radius)
    Polygon(pts, align=(Align.CENTER, Align.CENTER))
    RegularPolygon(radius, side_count)
    Text(txt, font_size, font="Arial", align=(Align.CENTER, Align.CENTER))
    SlotArc(arc, height)
    SlotCenterPoint(center, point, height)
    SlotCenterToCenter(center_separation, height)
    SlotOverall(width, height)
    Trapezoid(width, height, left_side_angle, right_side_angle)

### BuildLine() - 1D Line/Wire Builder
CRITICAL: BuildLine must be NESTED inside BuildSketch, then call make_face()!
CRITICAL: NEVER create helper functions for geometry - this BREAKS the context!

# CORRECT pattern (all inline, NO helper functions):
with BuildPart() as part:
    with BuildSketch(Plane.XY) as sk:
        with BuildLine() as ln:
            Line(start, end)
            RadiusArc(start, end, radius)
            # ... more lines/arcs
        make_face()  # REQUIRED: Convert wire to face
    extrude(amount=10)

# Available line/arc types:
Line(start, end)
Polyline(pts, close=False)
Spline(pts, tangents, tangent_scalars)
Bezier(pts)
JernArc(start, tangent, radius, arc_size)
RadiusArc(start, end, radius)
SagittaArc(start, end, sagitta)
TangentArc(end, tangent)
ThreePointArc(p1, p2, p3)

# WRONG - Helper functions ALWAYS fail:
def create_heart_sketch():  # DON'T DO THIS!
    with BuildSketch() as heart:
        with BuildLine() as ln:
            Line(...)
        make_face()
    return heart.sketch  # Isolated context, not connected to parent!

## CRITICAL: APIs That DO NOT EXIST (Never Use These)
The following are commonly hallucinated - they DO NOT exist in build123d:
- Arc(...) - Does NOT exist! Use RadiusArc, ThreePointArc, etc.
- CenterArc(...) - Does NOT exist! Use RadiusArc(start, end, radius)
- Circle(center=...) - Circle has NO center parameter! Use Locations instead
- shell(...) - Does NOT exist! Use offset(amount=-thickness, openings=face)
- offset_3d(...) - Just use offset()
- filter_by_position(...) - Does NOT exist! Use filter_by() and sort_by()

## Operations

### Extrusion
extrude(amount, dir=(0,0,1), both=False, taper=0, mode=Mode.ADD)

### Revolution
revolve(axis=Axis.Z, revolution_arc=360, mode=Mode.ADD)

### Loft
loft(sections, ruled=False, mode=Mode.ADD)

### Sweep
sweep(path, multisection=False, is_frenet=True, transition=Transition.TRANSFORMED, mode=Mode.ADD)

### Boolean Operations
mode=Mode.ADD       # Union (default)
mode=Mode.SUBTRACT  # Difference
mode=Mode.INTERSECT # Intersection
mode=Mode.REPLACE   # Replace existing geometry

### Modifications
fillet(objects, radius)
chamfer(objects, length, length2=None, angle=None)
offset(objects, amount, openings=None, kind=Kind.ARC, mode=Mode.REPLACE)  # Use for hollowing/shelling
mirror(about=Plane.XZ)
split(bisect_by, keep=Keep.TOP)

## Selectors (Semantic Selection)

### Sorting
.sort_by(Axis.X|Y|Z)
.first, .last

### Filtering
.filter_by(Axis.X|Y|Z)
.filter_by(GeomType.CIRCLE|LINE|PLANE|CYLINDER|...)

### Grouping
.group_by(Axis.X|Y|Z)

## CRITICAL: Positioning 2D Shapes
Circle, Rectangle, etc. do NOT have a center parameter.
Use Locations context to position shapes:
with Locations((x1, y1), (x2, y2)):
    Circle(radius)  # Creates circles at specified locations

## Location Helpers

### Single Locations
with Locations((x, y), (x2, y2), ...):
    # Objects placed at each location

### Grid Patterns
with GridLocations(x_spacing, y_spacing, x_count, y_count):
    # Objects placed in grid

### Polar Patterns
with PolarLocations(radius, count, start_angle=0, angular_range=360):
    # Objects placed in polar pattern

### Hex Patterns
with HexLocations(apothem, x_count, y_count):
    # Objects placed in hex grid

## Planes
Plane.XY, Plane.XZ, Plane.YZ
Plane.front, Plane.back, Plane.left, Plane.right, Plane.top, Plane.bottom
Plane(origin, x_dir, z_dir)

## Axes
Axis.X, Axis.Y, Axis.Z
Axis(origin, direction)

## Alignment
Align.MIN, Align.CENTER, Align.MAX
# Use: align=(Align.CENTER, Align.CENTER) for XY centering

## Export
result.export_stl("filename.stl")
result.export_step("filename.step")
result.export_brep("filename.brep")

## Complete Example
\`\`\`python
# ==========================================
# CONFIGURATION
# ==========================================
WIDTH_MM = 100.0
HEIGHT_MM = 20.0
HOLE_RADIUS_MM = 5.0

# ==========================================
# IMPLEMENTATION
# ==========================================
from build123d import (
    BuildPart, BuildSketch,
    Plane, Axis, Align, Mode,
    Rectangle, Circle,
    extrude,
    GridLocations,
)

with BuildPart() as part:
    with BuildSketch(Plane.XY):
        Rectangle(WIDTH_MM, WIDTH_MM, align=(Align.CENTER, Align.CENTER))
    extrude(amount=HEIGHT_MM)
    
    # Add holes at corners using semantic selection
    top_face = part.faces().sort_by(Axis.Z).last
    with BuildSketch(top_face):
        with GridLocations(WIDTH_MM - 20, WIDTH_MM - 20, 2, 2):
            Circle(HOLE_RADIUS_MM)
    extrude(amount=-HEIGHT_MM, mode=Mode.SUBTRACT)

result = part.part
\`\`\`
`;
}

/**
 * Main entry point
 */
async function main() {
    const args = process.argv.slice(2);
    const skipGemini = args.includes('--no-gemini');
    const generateAll = args.includes('--all') || args.length === 0;
    const generateOpenSCAD = generateAll || args.includes('--openscad');
    const generateBuild123d = generateAll || args.includes('--build123d');
    const options = { skipGemini };
    const condenseCreds = getCondenseApiKey();

    console.log('🔧 Torrify Context Generator\n');
    if (skipGemini) {
        console.log('  (Condense step disabled by --no-gemini)\n');
    } else if (condenseCreds) {
        console.log(`  Condense step: using ${condenseCreds.type === 'openrouter' ? 'OPENROUTER_API_KEY' : 'GEMINI_API_KEY'}\n`);
    } else {
        console.log('  No API key set for condense step. Set OPENROUTER_API_KEY or GEMINI_API_KEY to enable.\n');
    }
    
    if (generateOpenSCAD) {
        await generateOpenSCADContext(options);
        console.log('');
    }
    
    if (generateBuild123d) {
        await generateBuild123dContext(options);
        console.log('');
    }
    
    console.log('✨ Done!');
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

