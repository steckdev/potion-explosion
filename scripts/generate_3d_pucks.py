#!/usr/bin/env python3
"""
Generate 3D-Printable Pucks (3" Diameter Discs with Raised Elemental Emblems)
for The Great Alchemy Quest:
- Venom: Leaf with stem
- Fire: Flame symbol
- Frost: Glacier ice crystal cluster
- Shadow: Crescent moon with cosmic star

Specifications:
- Disc base: 3.0 inches (76.2 mm) diameter, 4.0 mm thickness with top chamfer.
- Raised emblems: 2.0 mm height (Z from 4.0 mm to 6.0 mm).
- Generates watertight binary STL files and 2-layer vector SVG files.
"""

import math
import os
import struct

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'models')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# Binary STL Exporter
# -------------------------------------------------------------
def write_binary_stl(filepath, triangles):
    """
    Writes a list of triangles to a binary STL file.
    Each triangle is ((x1,y1,z1), (x2,y2,z2), (x3,y3,z3)).
    """
    with open(filepath, 'wb') as f:
        header = b'Alchemy Quest 3D Puck - 3in Multi-Material Object'.ljust(80, b'\x00')
        f.write(header)
        f.write(struct.pack('<I', len(triangles)))
        for p1, p2, p3 in triangles:
            # Calculate face normal
            u = (p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2])
            v = (p3[0]-p1[0], p3[1]-p1[1], p3[2]-p1[2])
            nx = u[1]*v[2] - u[2]*v[1]
            ny = u[2]*v[0] - u[0]*v[2]
            nz = u[0]*v[1] - u[1]*v[0]
            mag = math.sqrt(nx*nx + ny*ny + nz*nz)
            if mag > 1e-9:
                nx /= mag
                ny /= mag
                nz /= mag
            else:
                nx, ny, nz = 0.0, 0.0, 1.0
            
            f.write(struct.pack('<3f', nx, ny, nz))
            f.write(struct.pack('<3f', p1[0], p1[1], p1[2]))
            f.write(struct.pack('<3f', p2[0], p2[1], p2[2]))
            f.write(struct.pack('<3f', p3[0], p3[1], p3[2]))
            f.write(struct.pack('<H', 0)) # Attribute byte count
    print(f"Generated binary STL: {filepath} ({len(triangles)} triangles)")

# -------------------------------------------------------------
# Triangulation (Ear-Clipping) for 2D Polygons
# -------------------------------------------------------------
def area2(p1, p2, p3):
    return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0])

def is_point_in_tri(pt, p1, p2, p3):
    d1 = area2(pt, p1, p2)
    d2 = area2(pt, p2, p3)
    d3 = area2(pt, p3, p1)
    has_neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
    has_pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
    return not (has_neg and has_pos)

def triangulate_polygon(poly):
    """Triangulates a simple 2D polygon counter-clockwise."""
    # Ensure CCW orientation
    area = 0.0
    n = len(poly)
    for i in range(n):
        area += poly[i][0] * poly[(i+1)%n][1] - poly[(i+1)%n][0] * poly[i][1]
    if area < 0:
        poly = poly[::-1]
    
    indices = list(range(len(poly)))
    triangles = []
    
    iters = 0
    while len(indices) > 3 and iters < 2000:
        iters += 1
        ear_found = False
        m = len(indices)
        for i in range(m):
            prev_idx = indices[(i - 1) % m]
            curr_idx = indices[i]
            next_idx = indices[(i + 1) % m]
            
            p_prev = poly[prev_idx]
            p_curr = poly[curr_idx]
            p_next = poly[next_idx]
            
            # Must be convex
            if area2(p_prev, p_curr, p_next) <= 1e-7:
                continue
                
            # Must not contain any other points
            has_inside = False
            for j in range(m):
                test_idx = indices[j]
                if test_idx in (prev_idx, curr_idx, next_idx):
                    continue
                if is_point_in_tri(poly[test_idx], p_prev, p_curr, p_next):
                    has_inside = True
                    break
            
            if not has_inside:
                triangles.append((poly[prev_idx], poly[curr_idx], poly[next_idx]))
                indices.pop(i)
                ear_found = True
                break
        if not ear_found:
            break
            
    if len(indices) == 3:
        triangles.append((poly[indices[0]], poly[indices[1]], poly[indices[2]]))
        
    return triangles

def extrude_polygon(poly_2d, z_bottom, z_top):
    """
    Extrudes a 2D CCW polygon into a watertight 3D prism between z_bottom and z_top.
    """
    triangles = []
    # Ensure CCW
    area = 0.0
    n = len(poly_2d)
    for i in range(n):
        area += poly_2d[i][0] * poly_2d[(i+1)%n][1] - poly_2d[(i+1)%n][0] * poly_2d[i][1]
    if area < 0:
        poly_2d = poly_2d[::-1]

    # 1. Top cap (Z = z_top, normal facing up)
    top_tris_2d = triangulate_polygon(poly_2d)
    for p1, p2, p3 in top_tris_2d:
        triangles.append((
            (p1[0], p1[1], z_top),
            (p2[0], p2[1], z_top),
            (p3[0], p3[1], z_top)
        ))

    # 2. Bottom cap (Z = z_bottom, normal facing down -> reverse order)
    for p1, p2, p3 in top_tris_2d:
        triangles.append((
            (p3[0], p3[1], z_bottom),
            (p2[0], p2[1], z_bottom),
            (p1[0], p1[1], z_bottom)
        ))

    # 3. Side walls
    m = len(poly_2d)
    for i in range(m):
        pA = poly_2d[i]
        pB = poly_2d[(i + 1) % m]
        
        # 4 vertices:
        # A_bot, B_bot, B_top, A_top
        A_bot = (pA[0], pA[1], z_bottom)
        B_bot = (pB[0], pB[1], z_bottom)
        A_top = (pA[0], pA[1], z_top)
        B_top = (pB[0], pB[1], z_top)
        
        # Triangle 1: A_bot -> B_bot -> B_top
        triangles.append((A_bot, B_bot, B_top))
        # Triangle 2: A_bot -> B_top -> A_top
        triangles.append((A_bot, B_top, A_top))

    return triangles

# -------------------------------------------------------------
# 1. Generate 3" Base Disc (76.2 mm diameter, 4 mm height)
# -------------------------------------------------------------
def generate_base_disc():
    """
    3.0 inches = 76.2 mm diameter (radius = 38.1 mm).
    Height = 4.0 mm:
    - Vertical wall from Z=0 to Z=3.2 mm (R=38.1 mm)
    - Bevel / chamfer from Z=3.2 to Z=4.0 mm (R from 38.1 to 36.5 mm)
    - Flat top from R=0 to R=36.5 mm at Z=4.0 mm
    """
    segments = 72
    r_outer = 38.1
    r_top = 36.5
    z_bottom = 0.0
    z_bevel = 3.2
    z_top = 4.0

    triangles = []
    angles = [2 * math.pi * i / segments for i in range(segments)]

    # Vertices on rings
    bot_ring = [(r_outer * math.cos(a), r_outer * math.sin(a), z_bottom) for a in angles]
    mid_ring = [(r_outer * math.cos(a), r_outer * math.sin(a), z_bevel) for a in angles]
    top_ring = [(r_top * math.cos(a), r_top * math.sin(a), z_top) for a in angles]

    # Center points
    c_bot = (0.0, 0.0, z_bottom)
    c_top = (0.0, 0.0, z_top)

    for i in range(segments):
        next_i = (i + 1) % segments

        # 1. Bottom face (pointing down)
        triangles.append((c_bot, bot_ring[next_i], bot_ring[i]))

        # 2. Lower cylinder wall (from z=0 to z=3.2)
        triangles.append((bot_ring[i], bot_ring[next_i], mid_ring[next_i]))
        triangles.append((bot_ring[i], mid_ring[next_i], mid_ring[i]))

        # 3. Chamfer wall (from z=3.2, r=38.1 to z=4.0, r=36.5)
        triangles.append((mid_ring[i], mid_ring[next_i], top_ring[next_i]))
        triangles.append((mid_ring[i], top_ring[next_i], top_ring[i]))

        # 4. Top face (pointing up)
        triangles.append((c_top, top_ring[i], top_ring[next_i]))

    return triangles

# -------------------------------------------------------------
# 2. Venom: Leaf with Small Stem Emblem
# -------------------------------------------------------------
def generate_venom_leaf_emblem():
    """
    Leaf with small stem sitting on top of the disc (Z=4.0 to Z=6.0 mm).
    """
    z_bot = 4.0
    z_top = 6.0
    triangles = []

    # Main leaf body polygon
    leaf_pts = []
    # Right contour (from tip (0, 22) down to base (0, -14))
    n_pts = 16
    for i in range(n_pts + 1):
        t = i / n_pts
        # Y from 22 down to -14
        y = 22.0 * (1 - t) + (-14.0) * t
        # Width profile (swelling out to ~16mm at middle)
        w = 16.5 * math.sin(t * math.pi) * (1.0 - 0.25 * t)
        leaf_pts.append((w, y))

    # Left contour (from base (0, -14) up to tip (0, 22))
    for i in range(n_pts + 1):
        t = i / n_pts
        y = (-14.0) * (1 - t) + 22.0 * t
        w = -16.5 * math.sin((1 - t) * math.pi) * (1.0 - 0.25 * (1 - t))
        if i > 0 and i < n_pts:
            leaf_pts.append((w, y))

    # Extrude main leaf body
    triangles.extend(extrude_polygon(leaf_pts, z_bot, z_top))

    # Stem polygon (curved stem at the bottom from Y=-12 to Y=-26)
    stem_pts = [
        (-2.2, -13.0),
        (-2.0, -18.0),
        (-4.0, -23.0),
        (-3.2, -26.0),
        (-1.2, -26.2),
        (0.2, -23.5),
        (1.8, -18.0),
        (2.0, -13.0)
    ]
    triangles.extend(extrude_polygon(stem_pts, z_bot, z_top))

    # Leaf center vein accent (thin raised ridge or distinct polygon)
    vein_pts = [
        (0.0, 20.0),
        (1.2, 5.0),
        (1.5, -10.0),
        (-1.5, -10.0),
        (-1.2, 5.0)
    ]
    triangles.extend(extrude_polygon(vein_pts, z_top, z_top + 0.4)) # Extra 0.4mm tactile vein

    return triangles, [leaf_pts, stem_pts]

# -------------------------------------------------------------
# 3. Fire: Flame Symbol Emblem
# -------------------------------------------------------------
def generate_fire_flame_emblem():
    """
    Stylized 3-tier leaping flame emblem (Z=4.0 to Z=6.0 mm).
    Outer flame + inner hollow flame teardrop accent.
    """
    z_bot = 4.0
    z_top = 6.0
    triangles = []

    # Outer flame contour
    outer_flame = [
        (0.0, 25.0),    # Top main flame tip
        (3.5, 18.0),
        (7.0, 16.5),
        (12.0, 13.0),   # Right upper crest
        (8.5, 9.0),     # Right notch
        (14.0, 6.0),    # Right middle flare
        (17.5, 0.0),    # Right lower belly
        (16.0, -8.0),
        (11.0, -15.0),
        (5.0, -21.0),
        (0.0, -23.0),   # Flame root
        (-5.0, -21.0),
        (-11.0, -15.0),
        (-16.0, -8.0),
        (-17.5, 0.0),   # Left lower belly
        (-14.0, 6.0),   # Left middle flare
        (-8.5, 9.0),    # Left notch
        (-11.0, 14.5),  # Left upper crest
        (-5.0, 17.5),
        (-2.5, 20.0)
    ]
    triangles.extend(extrude_polygon(outer_flame, z_bot, z_top))

    # Inner core flame (higher tier accent)
    inner_flame = [
        (0.0, 11.0),
        (3.5, 4.0),
        (6.0, -3.0),
        (4.0, -10.0),
        (0.0, -14.0),
        (-4.0, -10.0),
        (-6.0, -3.0),
        (-3.5, 4.0)
    ]
    triangles.extend(extrude_polygon(inner_flame, z_top, z_top + 0.5))

    return triangles, [outer_flame, inner_flame]

# -------------------------------------------------------------
# 4. Frost: Glacier Ice Crystal Cluster Emblem
# -------------------------------------------------------------
def generate_frost_glacier_emblem():
    """
    Faceted glacier crystal cluster (Z=4.0 to Z=6.0 mm).
    - Center tall spire
    - Left angled crystal
    - Right angled crystal
    - Base foreground crystal
    """
    z_bot = 4.0
    z_top = 6.0
    triangles = []

    # 1. Central tall glacier spire
    center_crystal = [
        (0.0, 25.0),   # Sharp spire tip
        (5.5, 16.0),
        (6.5, -4.0),
        (4.5, -16.0),
        (0.0, -18.0),
        (-4.5, -16.0),
        (-6.5, -4.0),
        (-5.5, 16.0)
    ]
    triangles.extend(extrude_polygon(center_crystal, z_bot, z_top + 0.6))

    # 2. Left angled crystal shard
    left_crystal = [
        (-10.0, 14.0),  # Left tip
        (-6.0, 7.0),
        (-7.0, -12.0),
        (-13.0, -13.0),
        (-16.0, -3.0),
        (-15.0, 8.0)
    ]
    triangles.extend(extrude_polygon(left_crystal, z_bot, z_top))

    # 3. Right angled crystal shard
    right_crystal = [
        (11.0, 16.0),   # Right tip
        (15.5, 9.0),
        (16.5, -3.0),
        (13.0, -13.0),
        (7.0, -11.0),
        (6.5, 7.0)
    ]
    triangles.extend(extrude_polygon(right_crystal, z_bot, z_top + 0.2))

    # 4. Bottom foreground shard
    base_crystal = [
        (0.0, -10.0),
        (7.0, -17.0),
        (0.0, -24.0),
        (-7.0, -17.0)
    ]
    triangles.extend(extrude_polygon(base_crystal, z_bot, z_top + 0.4))

    all_polys = [center_crystal, left_crystal, right_crystal, base_crystal]
    return triangles, all_polys

# -------------------------------------------------------------
# 5. Shadow: Crescent Moon with Star Emblem
# -------------------------------------------------------------
def generate_shadow_moon_emblem():
    """
    Crescent moon with cosmic 4-point star (Z=4.0 to Z=6.0 mm).
    """
    z_bot = 4.0
    z_top = 6.0
    triangles = []

    # Crescent Moon: Outer circle arc + inner cutout circle arc
    moon_pts = []
    # Outer circle: R=22.0 mm, from angle 1.15*pi to -1.15*pi
    n = 20
    for i in range(n + 1):
        a = 1.15 * math.pi - (2.3 * math.pi) * (i / n)
        # Shift slightly left
        x = 22.0 * math.cos(a) - 3.0
        y = 22.0 * math.sin(a)
        moon_pts.append((x, y))

    # Inner cutout circle: R=18.5 mm, from angle -0.98*pi back to 0.98*pi
    for i in range(n + 1):
        a = -0.98 * math.pi + (1.96 * math.pi) * (i / n)
        # Center shifted to (4.5, 0)
        x = 18.5 * math.cos(a) + 4.5
        y = 18.5 * math.sin(a)
        moon_pts.append((x, y))

    triangles.extend(extrude_polygon(moon_pts, z_bot, z_top))

    # Cosmic 4-point star inside the moon cradle
    cx, cy = 11.0, 2.0
    r_outer = 8.0
    r_inner = 2.4
    star_pts = []
    for i in range(8):
        a = math.pi / 2 - i * (math.pi / 4)
        r = r_outer if (i % 2 == 0) else r_inner
        star_pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))

    triangles.extend(extrude_polygon(star_pts, z_bot, z_top + 0.4))

    return triangles, [moon_pts, star_pts]

# -------------------------------------------------------------
# Vector SVG Exporter (Real-world millimeters: 76.2mm x 76.2mm)
# -------------------------------------------------------------
def export_puck_svg(filepath, emblem_polys, emblem_color, title):
    """
    Generates a high-precision 2-layer vector SVG (76.2mm x 76.2mm).
    Layer 1: Base Disc (3.0" / 76.2mm diameter)
    Layer 2: Emblem Polygons with color assignment
    """
    # SVG viewBox centered at (0, 0), from -38.1 to +38.1
    svg = [
        f'<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" width="76.2mm" height="76.2mm" viewBox="-38.1 -38.1 76.2 76.2">',
        f'  <title>{title} - 3" Alchemy Quest 3D Puck</title>',
        f'  <!-- Layer 1: 3-Inch Diameter Disc Base (Object 1: Color Assignment A) -->',
        f'  <g id="disc-base">',
        f'    <circle cx="0" cy="0" r="38.1" fill="#18142a" stroke="#332a52" stroke-width="0.8"/>',
        f'    <circle cx="0" cy="0" r="36.5" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="0.4" stroke-dasharray="1.5,1.5"/>',
        f'    <circle cx="0" cy="0" r="32.0" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.3"/>',
        f'  </g>',
        f'  <!-- Layer 2: Raised Emblem (Object 2: Color Assignment B - {emblem_color}) -->',
        f'  <g id="emblem-relief" fill="{emblem_color}" stroke="#ffffff" stroke-width="0.35" stroke-linejoin="round">'
    ]

    for poly in emblem_polys:
        # SVG path
        d_cmds = [f"M {poly[0][0]:.3f} {-poly[0][1]:.3f}"] # SVG y is inverted
        for pt in poly[1:]:
            d_cmds.append(f"L {pt[0]:.3f} {-pt[1]:.3f}")
        d_cmds.append("Z")
        svg.append(f'    <path d="{" ".join(d_cmds)}"/>')

    svg.append('  </g>')
    svg.append('</svg>')

    with open(filepath, 'w') as f:
        f.write("\n".join(svg))
    print(f"Generated Vector SVG: {filepath}")

# -------------------------------------------------------------
# Main Execution
# -------------------------------------------------------------
def main():
    print("=" * 60)
    print("Generating 3\" (76.2mm) 3D-Printable Alchemy Quest Pucks")
    print("=" * 60)

    # 1. Base Disc STL (Universal for all 4 elements)
    base_tris = generate_base_disc()
    base_stl_path = os.path.join(OUTPUT_DIR, 'puck_base_3in.stl')
    write_binary_stl(base_stl_path, base_tris)

    # 2. Venom Leaf
    venom_tris, venom_polys = generate_venom_leaf_emblem()
    write_binary_stl(os.path.join(OUTPUT_DIR, 'puck_venom_leaf.stl'), venom_tris)
    write_binary_stl(os.path.join(OUTPUT_DIR, 'puck_venom_combo.stl'), base_tris + venom_tris)
    export_puck_svg(os.path.join(OUTPUT_DIR, 'puck_venom.svg'), venom_polys, '#39ff14', 'Venom Leaf')

    # 3. Fire Flame
    fire_tris, fire_polys = generate_fire_flame_emblem()
    write_binary_stl(os.path.join(OUTPUT_DIR, 'puck_fire_flame.stl'), fire_tris)
    write_binary_stl(os.path.join(OUTPUT_DIR, 'puck_fire_combo.stl'), base_tris + fire_tris)
    export_puck_svg(os.path.join(OUTPUT_DIR, 'puck_fire.svg'), fire_polys, '#ff5722', 'Fire Flame')

    # 4. Frost Glacier
    frost_tris, frost_polys = generate_frost_glacier_emblem()
    write_binary_stl(os.path.join(OUTPUT_DIR, 'puck_frost_glacier.stl'), frost_tris)
    write_binary_stl(os.path.join(OUTPUT_DIR, 'puck_frost_combo.stl'), base_tris + frost_tris)
    export_puck_svg(os.path.join(OUTPUT_DIR, 'puck_frost.svg'), frost_polys, '#00d2ff', 'Frost Glacier')

    # 5. Shadow Moon
    shadow_tris, shadow_polys = generate_shadow_moon_emblem()
    write_binary_stl(os.path.join(OUTPUT_DIR, 'puck_shadow_moon.stl'), shadow_tris)
    write_binary_stl(os.path.join(OUTPUT_DIR, 'puck_shadow_combo.stl'), base_tris + shadow_tris)
    export_puck_svg(os.path.join(OUTPUT_DIR, 'puck_shadow.svg'), shadow_polys, '#bf5af2', 'Shadow Moon')

    print("=" * 60)
    print("All 3D Puck Models successfully generated!")
    print("=" * 60)

if __name__ == '__main__':
    main()
