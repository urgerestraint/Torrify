/**
 * Demo content for the Raspberry Pi 5 backing plate with heat-set inserts.
 * Used by the demo dialog and runDemo flow.
 */

export const DEMO_CODE = `// Raspberry Pi 5 backing plate (heat-set inserts)
// All dimensions are in millimeters.

// Board size
board_length = 85;
board_width = 56;

// Mount hole pattern (Pi standard)
hole_offset_x = 3.5;
hole_offset_y = 3.5;
hole_spacing_x = 58;
hole_spacing_y = 49;

// Plate parameters
plate_margin = 6;
plate_thickness = 3;
corner_radius = 3;

// Heat-set insert parameters (M2.5 typical)
insert_hole_diameter = 3.4; // adjust for your insert
insert_depth = 4.5;         // insert length
boss_diameter = 7.0;
boss_height = 6.0;

// Derived sizes
plate_length = board_length + 2 * plate_margin;
plate_width = board_width + 2 * plate_margin;

// Mount hole centers (origin at lower-left of plate)
hole_positions = [
  [plate_margin + hole_offset_x, plate_margin + hole_offset_y],
  [plate_margin + hole_offset_x + hole_spacing_x, plate_margin + hole_offset_y],
  [plate_margin + hole_offset_x, plate_margin + hole_offset_y + hole_spacing_y],
  [plate_margin + hole_offset_x + hole_spacing_x, plate_margin + hole_offset_y + hole_spacing_y],
];

module rounded_plate(size, radius, thickness) {
  linear_extrude(height = thickness)
    offset(r = radius)
      square([size[0] - 2 * radius, size[1] - 2 * radius], center = false);
}

module boss_with_insert(height, boss_d, hole_d, hole_depth) {
  difference() {
    cylinder(h = height, d = boss_d);
    translate([0, 0, height - hole_depth])
      cylinder(h = hole_depth, d = hole_d);
  }
}

// Build plate and bosses
union() {
  rounded_plate([plate_length, plate_width], corner_radius, plate_thickness);

  for (pos = hole_positions) {
    translate([pos[0], pos[1], plate_thickness])
      boss_with_insert(boss_height, boss_diameter, insert_hole_diameter, insert_depth);
  }
}
`

export const DEMO_PROMPT =
  'Create a Raspberry Pi 5 backing plate with heat-set inserts. The plate should have rounded corners, mounting bosses at the standard Pi hole positions, and be designed for M2.5 heat-set inserts.'

export const DEMO_RESPONSE = `I'll create a Raspberry Pi 5 backing plate with heat-set inserts for you. This design includes:

- A plate sized for the Raspberry Pi 5 board (85mm x 56mm) with margins
- Rounded corners for a professional look
- Four mounting bosses positioned at the standard Pi mounting hole locations
- Holes sized for M2.5 heat-set inserts

Here's the OpenSCAD code:

\`\`\`openscad
${DEMO_CODE}
\`\`\`

The design uses modules for the rounded plate and mounting bosses, making it easy to adjust parameters like plate thickness, corner radius, and insert dimensions. You can modify the variables at the top to customize the design for your specific needs.`
