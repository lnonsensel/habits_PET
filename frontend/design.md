# HabitPet — Organic Garden Design System

## Концепция

**«Твои привычки — это сад»**

Каждая привычка — семя. Пропущенный день — засуха. Регулярность — полив. Интерфейс передаёт это через тёплые органические формы, ботанические иллюстрации и ощущение бумажного дневника садовника.

---

## Цветовая палитра

| Токен | HEX | Применение |
|-------|-----|------------|
| `garden-parchment` | `#F5F0E8` | Основной фон страниц |
| `garden-cream` | `#FFFDF7` | Фон карточек, форм, навбара |
| `garden-forest` | `#2D6A4F` | Основной акцент, кнопки, ссылки |
| `garden-sage` | `#52B788` | Вторичный зелёный, focus ring |
| `garden-leaf` | `#95C4A0` | Светлый зелёный, SVG акценты |
| `garden-bark` | `#1A1A14` | Основной текст (заголовки) |
| `garden-soil` | `#6B5B4E` | Вторичный текст, подписи |
| `garden-clay` | `#C1440E` | Ошибки, предупреждения |
| `garden-mist` | `#D4E6D9` | Фон тегов, выделенных состояний |
| `garden-border` | `#D6C9B6` | Границы, разделители |
| `garden-amber` | `#C49A3C` | Акцент для особых состояний |

---

## Типографика

### Шрифты (Google Fonts — бесплатно)

| Шрифт | Роль | URL |
|-------|------|-----|
| **Playfair Display** | Заголовки, labels, логотип | `fonts.google.com/specimen/Playfair+Display` |
| **Lato** | Основной текст, UI | `fonts.google.com/specimen/Lato` |

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />
```

### Применение

- `font-display` (Playfair Display) — h1, h2, h3, italic labels в Input, логотип, цитаты
- `font-body` (Lato) — весь остальной UI текст, кнопки, теги, описания

### Иерархия

```
h1: Playfair Display, 700, 2rem–3rem — страничные заголовки
h2: Playfair Display, 600, 1.5rem   — секционные заголовки
labels: Playfair Display, 600, 0.875rem, italic
body: Lato, 400, 0.875rem–1rem
small/tags: Lato, 700, 0.7rem, uppercase, letter-spacing: 0.04em
```

---

## Тени (Paper Effect)

Тени имитируют бумагу, лежащую на тёплой поверхности:

```css
--shadow-paper:    2px 4px 14px rgba(45,106,79,0.10), 0 1px 3px rgba(26,26,20,0.06);
--shadow-paper-md: 3px 6px 20px rgba(45,106,79,0.13), 0 2px 5px rgba(26,26,20,0.08);
--shadow-paper-lg: 6px 10px 32px rgba(45,106,79,0.15), 0 3px 8px rgba(26,26,20,0.10);
```

Тень всегда имеет зелёный оттенок — как от листвы над столом.

---

## Текстура зерна

Фон body содержит SVG-шум (fractalNoise) с opacity 3.5% — имитирует текстуру бумаги/льна без дополнительных файлов:

```css
background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
```

---

## Компоненты

### Button

- **Форма:** `border-radius: 9999px` (pill)
- **Primary:** `bg-garden-forest text-garden-cream`, hover: темнеет на 10%, translateY(-2px)
- **Secondary:** прозрачный фон, forest green рамка и текст
- **Ghost:** граница garden-border, текст soil
- **Loading:** спиннер + текст «Прорастает…» (тематически)

### Input

- Label: **Playfair Display italic**, forest green
- Фон: garden-cream с inner shadow
- Фокус: ring garden-sage/40 + border garden-sage
- Ошибка: bg #FFF5F2, border garden-clay

### HabitCard

- Фон: garden-cream
- Левый акцент: 4px solid forest green (как закладка)
- Иконка: inline SVG leaf
- Теги: `.plant-tag` — маленькие, uppercase, border-left accent
- Delete: появляется только при hover на карточку

### Plant Tag (badge)

```css
border-radius: 2px 6px 6px 2px;
border-left: 2px solid currentColor;
font-size: 0.7rem;
text-transform: uppercase;
letter-spacing: 0.04em;
```

---

## Анимации

| Класс | Описание |
|-------|----------|
| `animate-fade-up` | Появление снизу вверх (page load) |
| `animate-fade-up-1/2/3` | То же с задержкой 0.1/0.2/0.3s (каскад) |
| `animate-fade-in` | Простое появление (ошибки, всплывашки) |
| `animate-leaf-sway` | Покачивание листа (логотип, декор) |

---

## Декоративные SVG элементы

Все SVG встроены inline — не требуют файлов:

- **Leaf mark** в HabitCard — маленький силуэт листа
- **Branch illustration** в LogoIcon — лист с жилками
- **Garden illustration** — растение в горшке (EmptyState)
- **Botanical panel** — большое растение на тёмном фоне (LoginPage)
- **Footer botanical** — три листа с ветвями

---

## Бесплатные ресурсы

### Шрифты
- [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) — Google Fonts (OFL)
- [Lato](https://fonts.google.com/specimen/Lato) — Google Fonts (OFL)
- Альтернативы заголовочных: `Cormorant Garamond`, `EB Garamond`, `Libre Baskerville`

### Иконки
- [Phosphor Icons](https://phosphoricons.com/) — MIT, 1400+ иконок, React-компоненты
- [Lucide](https://lucide.dev/) — MIT, форк Feather Icons, React-ready
- [Heroicons](https://heroicons.com/) — MIT, от создателей Tailwind

### Иллюстрации (ботанические)
- [unDraw](https://undraw.co/) — MIT, SVG иллюстрации, кастомный цвет
- [Storyset](https://storyset.com/) — бесплатно с атрибуцией, природные сцены
- [DrawKit](https://www.drawkit.com/) — freemium, ботанические сеты
- [Humaaans](https://humaaans.com/) — CC BY 4.0
- [Botanicals at Rawpixel](https://www.rawpixel.com/category/53/public-domain) — public domain винтажные ботанические гравюры

### Текстуры
- [Transparent Textures](https://www.transparenttextures.com/) — бесплатно, paper/linen/noise CSS bg
- [Hero Patterns](https://heropatterns.com/) — бесплатно, SVG паттерны
- [Subtle Patterns](https://www.toptal.com/designers/subtlepatterns/) — бесплатно, png текстуры

### Цвет
- [Coolors.co](https://coolors.co/) — генератор палитр
- [Palettte](https://palettte.app/) — редактор цветовых шкал
- [Khroma](https://khroma.co/) — AI color palettes

---

## Правила дизайна

1. **Зелёный — для жизни:** акцент forest только на элементах, которые ведут к действию или показывают прогресс
2. **Soil для поддержки:** вторичный текст всегда тёплый коричневый, не серый
3. **Никаких резких теней:** только paper shadow с зелёным оттенком
4. **Ботаника в пустых состояниях:** если данных нет — SVG-росток, не generic emoji
5. **Playfair italic для labels:** это подпись садовника в дневнике
6. **Pill-кнопки:** скруглённые до предела — мягко, как камешек в ручье
7. **Не больше 3 зелёных тонов на экране:** forest + sage + leaf, не смешивать
