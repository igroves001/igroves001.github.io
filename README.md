# Wedding Website Project Guide

## Overview

This is a single-page wedding website for Ian & Jade's wedding on May 1st, 2026, hosted on GitHub Pages. The site features a modern, elegant design with responsive layout, interactive FAQ section, and smooth scrolling navigation.

## Project Structure

The project consists of:

- `index.html` - Main single-page website with embedded CSS and JavaScript
- `_config.yml` - Jekyll configuration file (for GitHub Pages)
- `CNAME` - Custom domain configuration (www.ianandjade.co.uk)
- `images/` - Directory for images (currently contains weston-park-1.jpg)

## Key Features

- **Responsive Design**: Mobile-first approach with breakpoints for tablets and phones
- **Smooth Scrolling**: Navigation links smoothly scroll to sections
- **Interactive FAQ**: Accordion-style FAQ section with JavaScript
- **Custom Color Scheme**: Elegant palette using CSS variables
- **Typography**: Uses Google Fonts (Cormorant Garamond for headings, Montserrat for body)

## Content Editing Guide

### Site Structure

The site is organized into sections with unique IDs for navigation:

- **Hero Section** (`.hero`): Main landing area with names and date
- **Details Section** (`#details`): Key information cards
- **Venue Section** (`#venue`): Venue information with dark background
- **Dress Code Section** (`#dresscode`): Dress code guidelines
- **Schedule Section** (`#schedule`): Timeline of events
- **FAQ Section** (`#faq`): Interactive accordion FAQ
- **Footer**: Closing message

### Editing Content

All content is in [index.html](index.html). To update:

1. **Hero Section**: Update names and date in the hero area
2. **Details Cards**: Modify the `.detail-card` elements in the details grid
3. **Venue**: Update venue name, address, description, and external link
4. **Timeline**: Add/remove `.timeline-item` elements for schedule changes
5. **FAQ**: Duplicate the `.faq-item` structure to add new questions

### Updating Colors

All colors are defined as CSS variables in the `:root` selector (Lines 11-18):

- `--ink`: #1a1a1a (dark text)
- `--cream`: #faf8f5 (background)
- `--gold`: #c9a962 (accent color)
- `--gold-light`: #e8d9b0 (light gold)
- `--sage`: #8b9a7d (sage green)
- `--blush`: #d4a5a5 (blush pink)
- `--slate`: #4a4a4a (secondary text)

## Customization Guide

### Adding Images

1. Place images in the `images/` directory
2. Reference them in HTML: `<img src="images/your-image.jpg" alt="Description">`

### Modifying Navigation

Update the navigation links (Lines 830-836) to match your section IDs:

```html
<nav>
    <a href="#details">The Day</a>
    <a href="#venue">Venue</a>
    <!-- Add more links as needed -->
</nav>
```

### Adding New Sections

1. Create a new `<section>` with a unique `id`
2. Add corresponding navigation link
3. Follow the existing section structure with `.section-title` and `.section-subtitle`

## Deployment

### GitHub Pages Setup

1. **Repository Configuration**:
   - Repository name: `igroves001.github.io`
   - Branch: `main` (GitHub Pages serves from main branch)
   - Enable GitHub Pages in repository settings

2. **Custom Domain**:
   - The `CNAME` file contains: `www.ianandjade.co.uk`
   - Configure DNS settings with your domain provider to point to GitHub Pages
   - In GitHub repository settings, add the custom domain

3. **Jekyll Configuration**:
   - `_config.yml` contains basic Jekyll settings for GitHub Pages
   - GitHub Pages automatically processes the site

### Local Preview

Simply open `index.html` in your web browser to preview the site locally. No build process or server required.

## Technical Details

### Architecture Philosophy

**Lightweight & Simple**: This site is intentionally minimal - HTML and JavaScript only. External resources are used sparingly and only when necessary (e.g., Google Fonts for typography).

### Technologies Used

- **HTML5**: Semantic markup, single-file structure
- **CSS3**: Embedded styles with CSS custom properties, flexbox, grid, animations
- **Vanilla JavaScript**: Minimal JavaScript for FAQ accordion functionality (no frameworks)
- **Jekyll**: Minimal configuration for GitHub Pages compatibility
- **Google Fonts**: External font loading (only external dependency)

### File Structure

- All styles are embedded in `<style>` tag within `index.html`
- All JavaScript is embedded in `<script>` tag at the bottom of `index.html`
- No build process required - edit HTML directly
- Images stored in `images/` directory

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive breakpoints: 768px, 600px, 380px

### Performance Considerations

- All CSS and JavaScript is inline (no external requests except fonts)
- Images should be optimized before adding
- Google Fonts loaded with `preconnect` for performance
- Minimal JavaScript footprint

## Maintenance

### Keeping It Lightweight

When making changes:

- Keep all CSS and JavaScript inline in `index.html`
- Avoid adding external libraries or frameworks
- Optimize images before adding to `images/` directory
- Only add external resources when absolutely necessary

### Testing

- Open `index.html` directly in browser to test changes
- Test on mobile devices or use browser dev tools
- Verify all navigation links work correctly
- Check FAQ accordion functionality

## File Locations Reference

- **Main content**: [index.html](index.html) (Lines 829-1032)
- **Styles**: [index.html](index.html) (Lines 10-827)
- **JavaScript**: [index.html](index.html) (Lines 1012-1031)
- **Jekyll config**: [_config.yml](_config.yml)

