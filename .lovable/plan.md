
## Clone: Заплање — Локални Портал (Zaplanje Local News Portal)

A Serbian local news portal for the Zaplanje region with category-based articles, dialect switching, and a sidebar with trending articles.

### 1. Design System & Styling
- Update `index.css` with custom color palette: warm background (`50 33% 97%`), navy foreground (`213 52% 23%`), category accent colors (news=red, culture=purple, tradition=green, events=purple, nature=green, sport=navy, highlight=gold)
- Import Google Fonts: **Merriweather** (serif, headings) + **Inter** (sans, body)
- Update `tailwind.config.ts` with custom font families and `cat-*` color tokens
- Add a colorful top border strip using category colors

### 2. Types & Mock Data
- Create `src/lib/types.ts` with `Category`, `DialectZone`, and `Article` types
- Create `src/lib/mockData.ts` with 8 sample articles in Serbian (Вести, Култура, Традиција, Догађаји, Природа, Спорт) using Unsplash images

### 3. Components
- **CategoryBadge** — colored badge pill for article categories
- **Header** — logo ("Заплање / ЛОКАЛНИ ПОРТАЛ"), category navigation links with colored text, dialect zone toggle button (Стандардни / Зона I / Зона II), mobile hamburger menu
- **HeroArticle** — full-width featured article card with background image, category badge, title, excerpt, author, date, read time
- **ArticleCard** — smaller card with image, category badge, title, excerpt, author, date
- **PortalSidebar** — "Најчитаније" (Most Read) trending list with numbered items, category dots, and article titles
- **Footer** — multi-column footer with О нама, Категорије, Контакт sections + copyright

### 4. Index Page Layout
- Header at top with multi-color accent border
- Hero article (first from mock data)
- Grid section: "Најновије" heading + 2-column article cards + sidebar with trending articles
- Footer at bottom
