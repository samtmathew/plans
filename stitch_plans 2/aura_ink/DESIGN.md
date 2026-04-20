# Design System Specification: The Curated Ledger

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Curated Social Ledger."** 

We are moving away from the clinical, utilitarian feel of traditional "event planners" and toward a high-end editorial experience. This system balances the breathing room of a digital workspace (Notion) with the vibrant, imagery-rich density of a mood board (Pinterest). 

The goal is to make a group hangout feel like a curated collection of moments rather than a list of logistics. We achieve this through **intentional asymmetry**, where serif italics break the rigid grid, and **tonal layering**, where depth is felt rather than seen. The vibe is human, warm, and premium—it should feel like a well-designed physical invitation.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a warm, off-white foundation to avoid the "blue-light" coldness of standard apps.

### Core Palette
- **Primary Foundation:** `background` (#FCF9F8) and `surface_container_lowest` (#FFFFFF).
- **Ink:** `on_surface` (#1C1B1B) for maximum legibility.
- **Atmospheric Neutral:** `secondary` (#5E5E5E) and `on_surface_variant` (#464651) for metadata.
- **The Signature:** `primary_container` (#3D3D8F) is our deep indigo accent. Use it sparingly—it’s a mark of intent, not a structural tool.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders for sectioning content. To separate a header from a body or one card from another, use background color shifts. A `surface_container_low` section sitting on a `surface` background provides all the definition a user needs. If a container feels "lost," increase the padding rather than adding a stroke.

### Surface Hierarchy & Nesting
Treat the UI as stacked sheets of fine paper. 
- **Base Level:** `surface` (#FCF9F8)
- **Nested Content:** `surface_container` (#F0EDEC)
- **Interactive Floating Elements:** `surface_container_lowest` (#FFFFFF)

### The "Glass & Gradient" Rule
To elevate the experience beyond flat design, use **Glassmorphism** for floating navigation or overlay cards. Use `surface_container_lowest` at 80% opacity with a `24px` backdrop blur. For primary CTAs, a subtle linear gradient from `primary` (#262477) to `primary_container` (#3D3D8F) adds a "soul" and depth that prevents the UI from feeling "coded."

---

## 3. Typography: The Editorial Tension
We use a high-contrast typographic pairing to signal both "Social" and "Functional."

- **The Voice (Display/Hero):** *Instrument Serif* (Italic). 
  - Use `display-lg` to `headline-sm` for titles, activity names, and "human" moments. 
  - *Note:* Italicization is mandatory for headings to create an organic, editorial flow.
- **The Engine (Functional UI):** *Geist* or *DM Sans*.
  - Use `title-md` for navigation and `body-md` for descriptions. 
  - This provides the "Notion-clean" spatial clarity required for planning logistics.

The hierarchy should feel top-heavy: large, expressive serif titles transitioning into compact, highly legible sans-serif functional blocks.

---

## 4. Elevation & Depth
We convey importance through **Tonal Layering** rather than structural shadows.

### The Layering Principle
Depth is achieved by "stacking" the surface-container tiers. Place a `surface_container_lowest` card (Pure White) on a `surface_container_low` background. The subtle 1-2% shift in brightness creates a soft, natural lift.

### Ambient Shadows
Shadows are a last resort. When a "floating" effect is required (e.g., a modal or a primary button), use a **Low-Opacity Ambient Shadow**:
- `box-shadow: 0 4px 20px rgba(28, 27, 27, 0.04);`
The shadow must be a tinted version of the `on_surface` color, never pure black.

### The "Ghost Border" Fallback
If accessibility requires a border (e.g., in a high-density grid), use a **Ghost Border**:
- `outline-variant` (#C7C5D3) at 15% opacity. 
- **Prohibited:** 100% opaque, high-contrast borders.

---

## 5. Components

### Cards (The Masonry Unit)
- **Radius:** `12px` (`xl` scale).
- **Style:** No borders. Use `surface_container_low` as the card background.
- **Density:** Pinterest-style. Group cards in tight clusters with `16px` gaps. Use vertical white space to separate groups, never horizontal rules.

### Buttons (The Action)
- **Radius:** `8px` (`DEFAULT` scale).
- **Primary:** `primary_container` background with `on_primary` text.
- **Secondary:** `surface_container_high` background. No border.
- **Pills:** Use `999px` (`full` scale) only for status indicators (e.g., "Confirmed", "Pending") or tags.

### Input Fields
- **Radius:** `8px`.
- **Style:** `surface_container_lowest` background with a 10% opacity `outline`. On focus, transition the background to `surface`.
- **Labels:** Use `label-md` in `secondary` text.

### Lists & Tooltips
- **Lists:** Forbid divider lines. Use `8px` of vertical padding between items. Use a subtle `surface_variant` hover state to indicate interactivity.
- **Tooltips:** `surface_dim` background with `surface_bright` text. `4px` radius.

---

## 6. Do’s and Don’ts

### Do:
- **Embrace Asymmetry:** Align a large serif heading to the left, but keep the functional body text in a narrower, centered column.
- **Use "Pinterest" Density:** In activity feeds, allow images to vary slightly in aspect ratio to create a rhythmic, non-robotic layout.
- **Prioritize Breathing Room:** If a screen feels cluttered, increase the `surface` background space rather than adding more containers.

### Don’t:
- **Don’t Use Dividers:** Never use a `<hr>` or a 1px border to separate list items. Use white space or tonal shifts.
- **Don’t Use Travel Tropes:** Avoid airplane icons, suitcase motifs, or "booking" language. Use human language like "Getting together," "The Vibe," and "Who's coming."
- **Don’t Standardize the Serif:** Never use *Instrument Serif* for functional UI (buttons, inputs, or small labels). It is for "moments," not "mechanics."
- **Don’t Use Pure Black Shadows:** It kills the "warmth" of the `fcf9f8` background. Always tint shadows with the surface color.