---
description: (xriu) Generate comprehensive design and coding prompts for modern SaaS dashboard UIs based on visual analysis
---

Based on the visual analysis of the provided screenshots, here is a comprehensive prompt you can use. This is designed to be effective for both **AI Image Generators** (like Midjourney/DALL-E) to recreate the visual style, and **AI Coding Assistants** (like v0 or Cursor) to generate the code.

### 1. The "Design Philosophy" Prompt (For Visuals/Context)

Use this prompt to describe the exact look and feel you want to achieve:

> **"A high-fidelity, modern SaaS dashboard UI in light mode. The aesthetic is clean, minimalist, and 'clean corporate' style similar to Linear or Stripe dashboards.**
>
> **Key Visual Specs:**
>
> - **Background:** Off-white/Light Gray (`#F3F4F6` / `bg-gray-50`) canvas.
> - **Surfaces:** Pure white (`#FFFFFF`) cards with `rounded-2xl` corners and soft, diffused drop shadows (`shadow-sm` or `shadow-md`).
> - **Typography:** Clean Sans-Serif font (Inter, SF Pro, or Roboto). High contrast for headings (`text-gray-900`), muted gray for labels (`text-gray-500`).
> - **Color Palette:**
>   - **Primary:** Deep Indigo or Blurple for active states/brand elements.
>   - **Accents:** Vibrant but pastel-toned functional colors: Emerald Green (Success/Growth), Amber/Orange (Warning/Pending), Rose Red (Error/Decline), Sky Blue (Info).
> - **Layout Structure:**
>   - **Sidebar:** Vertical navigation on the left (collapsible or icon+label), white background, clean line icons (Feather/Heroicons).
>   - **Top Bar:** Minimalist header with global search (pill-shaped input), notification bell, and user profile avatar.
>   - **Content:** A flexible 'Bento Grid' layout containing metric cards, charts, and data tables.
> - **Specific Components:**
>   - **Metric Cards:** display a label, big value, and a percentage change pill (green/red) with a mini sparkline.
>   - **Charts:** Smooth spline line charts with gradient fills, and rounded-top bar charts.
>   - **Data Tables:** Spacious rows with hover effects, user avatars, and pill-shaped status badges (e.g., 'Paid' in green text on light green bg).
>   - **Glassmorphism:** Subtle use of blur on floating elements or sticky headers."

### 2. The "Coding" Prompt (For Cursor/v0/Dev)

If you want an AI to write the code for this, paste this into your composer:

> "Create a responsive Dashboard layout using **React**, **Tailwind CSS v4**, and **Recharts** (for data viz).
>
> **Design Requirements:**
>
> 1.  **Layout:** A sidebar-layout with a fixed left navigation (width ~64 or 240px) and a scrollable main content area with a gray-50 background.
> 2.  **Navigation (Sidebar):**
>     - Include a logo at the top.
>     - Vertical list of links: Dashboard, Invoices, Tasks, Leads, Analytics.
>     - Use Lucide-React icons.
>     - Active state: Light gray background with dark text and a colored indicator bar or icon.
> 3.  **Dashboard View (Main):**
>     - **Stats Row:** 4-5 cards at the top displaying metrics (e.g., 'Total Revenue', 'Active Users'). Include a trend indicator (arrow up/down) in green/red.
>     - **Charts Section:**
>       - A large main card (spanning 2/3 width) with a **Recharts AreaChart** (gradient fill) showing revenue over time.
>       - A side card (1/3 width) showing a **BarChart** or Donut chart for categorical data (e.g., 'Traffic Source').
>     - **Recent Transactions/Invoices Table:** A full-width card containing a table.
>       - Columns: Customer (Avatar + Name), Date, Amount, Status, Actions.
>       - **Status Pills:** Create a reusable `Badge` component that takes a status ('Paid', 'Pending', 'Failed') and applies `bg-{color}-100 text-{color}-700` styling.
> 4.  **UI Details:**
>     - Use `rounded-2xl` for all main cards.
>     - Use `border border-gray-100` for subtle definition.
>     - Font family should be `font-sans` (Inter).
>     - Ensure generous padding (`p-6` or `p-8`) inside cards.
> 5.  **Interactive Elements:**
>     - Hover states on table rows (`hover:bg-gray-50`).
>     - A 'Search' input in the top header with a magnifying glass icon.
>     - 'Filter' and 'Export' buttons styled as outlines with icons."

### 3. Color Codes extracted from images (Approximate)

- **Background:** `#F9FAFB` (Gray 50)
- **Card Bg:** `#FFFFFF` (White)
- **Text Primary:** `#111827` (Gray 900)
- **Text Secondary:** `#6B7280` (Gray 500)
- **Green (Success):** `#10B981` (Emerald 500) / BG: `#D1FAE5`
- **Red (Error):** `#EF4444` (Red 500) / BG: `#FEE2E2`
- **Orange (Warning):** `#F59E0B` (Amber 500) / BG: `#FEF3C7`
- **Blue (Primary/Info):** `#3B82F6` (Blue 500)
