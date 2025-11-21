# Adding Your Company Logo

## Steps to Add Your Logo:

1. **Place your logo file** in the `public` folder:
   - File name: `logo.png` (or `logo.jpg`, `logo.svg`)
   - Recommended size: 200-300px width, auto height
   - Supported formats: PNG, JPG, SVG

2. **Update the logo path** in `components/CompanyLogo.tsx` if using a different filename:
   - Change `src="/logo.png"` to your logo filename

3. **Update the copyright text** in `app/layout.tsx`:
   - Change "Your Company Name" to your actual company name

## Current Setup:
- Logo location: `public/logo.png`
- Fallback: If logo doesn't exist, "Survey Platform" text will be shown
- Footer: Shows copyright with current year automatically

