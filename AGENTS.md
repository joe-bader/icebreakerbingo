# AGENTS.md - Icebreaker Bingo

## Project Overview

This is a simple static HTML website for Icebreaker Bingo. The application is a single `index.html` file containing all HTML, CSS, and JavaScript. It renders a 5x5 bingo board with randomized icebreaker prompts and tracks highlighted squares and bingo achievements.

## Build, Lint, and Test Commands

### Build Commands
This is a static HTML project with no build system required. To view the site:
- Open `index.html` directly in a browser
- Or serve locally: `python3 -m http.server 8000` then visit `http://localhost:8000`

### Linting
No formal linter is configured. For manual linting:
- **HTML**: Use [W3C HTML Validator](https://validator.w3.org/)
- **CSS**: Use [CSS Validator](https://jigsaw.w3.org/css-validator/)
- **JavaScript**: Use ESLint with browser environment config

To add ESLint if needed:
```bash
npm init -y
npm install eslint --save-dev
npx eslint --env browser index.html
```

### Testing
No automated tests exist. Manual testing checklist:
1. Open `index.html` in browser
2. Verify bingo board renders with 25 cells (24 prompts + 1 free space)
3. Click cells to verify checkbox toggle works
4. Check that counter updates correctly
5. Verify horizontal, vertical, and diagonal bingos trigger celebration
6. Verify celebration overlay displays and can be dismissed
7. Test responsive behavior on different screen sizes

### Running a Single Test
Since there are no automated tests, manual verification is required for each change.

## Code Style Guidelines

### General Principles
- Keep the single-file architecture unless the project grows significantly
- Maintain readability over clever one-liners
- Add comments for complex logic only

### HTML
- Use semantic HTML5 elements (`<header>`, `<main>`, `<section>`, etc.)
- Include `lang` attribute on `<html>` element
- Use `meta` tags for charset and viewport
- Close all tags properly
- Use double quotes for attributes

### CSS
- Use meaningful class names (e.g., `.bingo-cell`, not `.cell-1`)
- Group related styles together
- Use CSS custom properties for colors if project expands
- Prefer flexbox and grid for layout
- Keep specificity low (avoid deeply nested selectors)
- Use shorthand properties where appropriate
- Add vendor prefixes only when necessary

**Example**:
```css
.container {
    display: flex;
    justify-content: center;
    align-items: center;
}
```

### JavaScript
- Use `const` by default, `let` when reassignment needed, avoid `var`
- Use meaningful variable and function names (camelCase)
- Prefer ES6+ features (arrow functions, template literals, destructuring)
- Use strict equality (`===`) over loose equality (`==`)
- Declare variables at the top of their scope
- Use semantic function names describing what they do

**Example**:
```javascript
const selectedItems = items.filter(item => item.active);
const total = items.reduce((sum, item) => sum + item.value, 0);
```

### Naming Conventions
- **Variables/Functions**: camelCase (`handleClick`, `bingoCount`)
- **Classes/Components**: PascalCase if used with component libraries
- **CSS Classes**: kebab-case (`.bingo-cell`, `.celebration-overlay`)
- **Constants**: SCREAMING_SNAKE_CASE for true constants

### Error Handling
- Use `try/catch` for code that may throw
- Add inline comments for complex logic
- Avoid silently catching errors
- For user interactions, provide visual feedback

### Accessibility
- Ensure all interactive elements are keyboard accessible
- Use appropriate contrast ratios
- Include alt text for meaningful images
- Use ARIA labels where semantic HTML isn't sufficient

### Performance Considerations
- Minimize DOM manipulations
- Use event delegation where appropriate
- Avoid repeated style calculations in loops

### File Organization
This project uses a single-file structure:
- `index.html` - Contains all HTML, CSS in `<style>`, and JS in `<script>`

If the project grows, consider splitting into:
- `index.html`
- `styles/main.css`
- `js/app.js`

### Version Control
- Commit messages should be clear and descriptive
- Keep commits atomic and focused
- Run basic manual testing before committing

### Browser Support
Target modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions). Avoid IE-specific code unless explicitly required.

## Working With This Codebase

### Common Development Tasks

#### Running the Development Server
To preview changes locally:
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000 in your browser.

#### Making Changes to the Bingo Prompts
The icebreaker prompts are stored in the `icebreakers` array in the `<script>` section (around line 208). Add new prompts by appending strings to the array. The board randomly selects 24 prompts from this pool.

#### Modifying Styles
All CSS is in the `<style>` tag in the `<head>` section. Key classes:
- `.bingo-board`: The main grid container
- `.bingo-cell`: Individual cell styling
- `.celebration`: The bingo celebration overlay

#### Modifying Game Logic
Game logic functions are in the `<script>` section:
- `handleClick(row, col)`: Handles cell clicks
- `checkBingo()`: Checks for winning lines
- `showCelebration()`: Displays the celebration overlay

### Code Review Checklist
Before submitting changes:
- [ ] HTML validates without errors
- [ ] CSS has no syntax errors
- [ ] JavaScript has no syntax errors
- [ ] All 25 cells render correctly (24 prompts + 1 free space)
- [ ] Clicking cells toggles their state
- [ ] Counter updates accurately
- [ ] Bingo detection works for all 12 winning lines (5 horizontal, 5 vertical, 2 diagonal)
- [ ] Celebration overlay appears and can be dismissed
- [ ] Responsive design works on mobile and desktop

### Adding New Features

#### Adding a New Winning Pattern
To add new winning patterns, modify the `winningLines` array in `checkBingo()`:
```javascript
const winningLines = [
    // existing patterns...
    [0, 6, 12, 18, 24], // existing diagonal
    // add new pattern here, e.g., a T-shape:
    [0, 1, 2, 3, 4, 7, 12, 17, 22]
];
```

#### Adding Animations
Add CSS animations in the `<style>` section using `@keyframes`:
```css
@keyframes myAnimation {
    from { opacity: 0; }
    to { opacity: 1; }
}
```

Then apply with: `animation: myAnimation 0.5s ease-in-out;`

### Debugging Tips
- Use browser DevTools (F12) to inspect elements and debug JavaScript
- Check the Console tab for JavaScript errors
- Use the Elements tab to inspect and modify CSS in real-time
- The `board` array tracks cell states: index 0-24 maps to row-major order

## Future Considerations

If the project expands, consider:
- Splitting into separate HTML, CSS, and JS files
- Adding automated tests with a framework like Jest or Playwright
- Implementing local storage to persist game state
- Adding sound effects for interactions
- Creating a print-friendly version for physical bingo cards
