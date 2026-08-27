# Mobile-First & Universal Responsive Design Rule

## Core Directive
All pages, components, layouts, typography, buttons, cards, and media across the website MUST be 100% mobile-friendly and responsive across ALL screen sizes, from compact mobile phones (320px, 375px, 414px) up to ultra-wide desktop monitors (1440px+).

## Mandatory Standards
1. **Viewport & Container Safety:**
   - Always maintain `width: 100%; max-width: 100vw; overflow-x: hidden;` on body/html.
   - Use fluid responsive containers with horizontal clamp padding (`padding-left: clamp(1rem, 3.5vw, 2rem);`).
   - Use `overflow-wrap: break-word; word-break: break-word;` on text to prevent overflow.

2. **Fluid Typography & Imagery:**
   - Use `clamp()` for scalable headings and titles (e.g. `font-size: clamp(1.85rem, 5vw, 2.75rem);`).
   - Images and media elements must always have `max-width: 100%; height: auto;`.

3. **Touch-Friendly Controls:**
   - Interactive buttons, pills, and filter buttons must maintain a minimum touch target height of 38px to 44px.
   - Filter bars on mobile must support horizontal scrolling without breaking the layout (`overflow-x: auto; -webkit-overflow-scrolling: touch;`).

4. **Breakpoints Hierarchy:**
   - Large Desktop / Monitors: `> 1024px` (3 or 4 columns)
   - Tablets & Laptops: `<= 1024px` (2 columns)
   - Large Mobile: `<= 768px` (stacked drawer, 1 or 2 columns)
   - Standard Mobile: `<= 640px` (1 column, full-width actions)
   - Compact Mobile: `<= 480px` (stacked headers, badge wrapping)
   - Ultra-compact Mobile: `<= 380px` (full width buttons, condensed padding)
