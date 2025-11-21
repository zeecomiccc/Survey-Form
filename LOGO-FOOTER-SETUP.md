# Logo and Footer Setup Guide

## 📸 Logo Placement

### Where to Place Your Logo:

1. **Place your logo file** in the `public` folder:
   ```
   public/logo.png
   ```

2. **Supported formats:**
   - PNG (recommended)
   - JPG/JPEG
   - SVG (best for scalability)

3. **Recommended specifications:**
   - Width: 200-300px
   - Height: Auto (maintain aspect ratio)
   - File size: Under 500KB for faster loading
   - Background: Transparent (PNG) or white

### Logo File Location:
```
Survey/
└── public/
    └── logo.png  ← Place your logo here
```

### Current Logo Configuration:
- **File path:** `public/logo.png`
- **Component:** `components/CompanyLogo.tsx`
- **Fallback:** If logo doesn't exist, "Survey Platform" text will be displayed

### To Change Logo Filename:
If your logo has a different name (e.g., `company-logo.svg`), update `components/CompanyLogo.tsx`:

```tsx
// Change this line:
<img src="/logo.png" ... />

// To:
<img src="/company-logo.svg" ... />
```

---

## 📝 Footer Text Configuration

### Where to Edit Footer Text:

**File:** `app/layout.tsx`

**Current location:** Line 19

```tsx
<footer className="bg-gray-800 text-white py-2 px-4 text-center text-xs border-t border-gray-700 sticky bottom-0 z-50 flex-shrink-0">
  <p>&copy; {new Date().getFullYear()} Global Outreach. All rights reserved.</p>
</footer>
```

### To Customize Footer Text:

1. **Change Company Name:**
   ```tsx
   <p>&copy; {new Date().getFullYear()} Your Company Name. All rights reserved.</p>
   ```

2. **Add More Information:**
   ```tsx
   <footer className="...">
     <p>&copy; {new Date().getFullYear()} Global Outreach. All rights reserved.</p>
     <p className="mt-1">Contact: naveed@globaloutreach.co</p>
   </footer>
   ```

3. **Custom Footer:**
   ```tsx
   <footer className="...">
     <div className="flex flex-col items-center gap-1">
       <p>&copy; {new Date().getFullYear()} Global Outreach. All rights reserved.</p>
       <p className="text-gray-400">Powered by Survey Platform</p>
     </div>
   </footer>
   ```

### Footer Features:
- ✅ Automatically updates year (no manual changes needed)
- ✅ Sticky footer (stays at bottom when scrolling)
- ✅ Responsive design
- ✅ Dark theme (gray-800 background)

---

## 🎨 Customization Options

### Logo Size:
To change logo size, edit `components/CompanyLogo.tsx`:

```tsx
// Current: h-10 (40px height)
<img src="/logo.png" className="h-10 w-auto" ... />

// Make it larger:
<img src="/logo.png" className="h-12 w-auto" ... />  // 48px
<img src="/logo.png" className="h-16 w-auto" ... />  // 64px

// Make it smaller:
<img src="/logo.png" className="h-8 w-auto" ... />   // 32px
```

### Footer Styling:
To change footer appearance, edit `app/layout.tsx`:

```tsx
// Change background color:
className="bg-gray-800 ..."  // Dark gray (current)
className="bg-blue-900 ..."  // Dark blue
className="bg-indigo-900 ..." // Dark indigo

// Change text size:
className="... text-xs ..."  // Extra small (current)
className="... text-sm ..."  // Small
className="... text-base ..." // Base
```

---

## ✅ Quick Setup Checklist

- [ ] Place logo file in `public/logo.png`
- [ ] Update footer text in `app/layout.tsx` (if needed)
- [ ] Test logo displays correctly
- [ ] Test footer appears on all pages
- [ ] Verify logo fallback works (if logo missing)

---

## 📧 Support

For questions or issues:
- **Author:** Naveed Arif
- **Company:** Global Outreach
- **Email:** naveed@globaloutreach.co

