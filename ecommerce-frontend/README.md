# TechStore - E-Commerce Frontend

A beautiful, responsive React e-commerce frontend built with Tailwind CSS and the Frontend Design skill guidelines.

## ✨ Features

- **Product Catalog** - Browse products with filtering and search
- **Product Details** - View detailed product information, specs, and reviews
- **Shopping Cart** - Add/remove items, update quantities
- **Checkout Flow** - Multi-step checkout with shipping and payment options
- **Order Tracking** - Real-time order status and shipment tracking
- **Order History** - View past orders and their details
- **Mobile Responsive** - Beautiful design on all screen sizes
- **Modern UI** - Built with Tailwind CSS and custom components

## 🎨 Design System

Uses the Frontend Design skill color palette:
- **Primary**: #1B3A5C (Dark Blue) - Main branding
- **Secondary**: #2E86C1 (Blue) - Highlights and links
- **Accent**: #E74C3C (Red) - Warnings and important actions
- **Success**: #27AE60 (Green) - Positive feedback
- **Warning**: #F39C12 (Amber) - Warnings

## 📱 Responsive Breakpoints

- **Mobile**: Up to 640px
- **Tablet**: 640px - 768px
- **Desktop**: 768px - 1024px
- **Large Desktop**: 1024px+

## 🛠️ Tech Stack

- **React 18** - UI library
- **React Router 6** - Client-side routing
- **Tailwind CSS 3** - Utility-first styling
- **Axios** - HTTP client
- **JavaScript ES6+** - Modern JavaScript

## 📦 Project Structure

```
ecommerce-frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.js
│   │   ├── Footer.js
│   │   ├── ProductCard.js
│   │   ├── Button.js
│   │   ├── Alert.js
│   │   ├── Spinner.js
│   │   └── Badge.js
│   ├── pages/
│   │   ├── HomePage.js
│   │   ├── ProductsPage.js
│   │   ├── ProductDetailPage.js
│   │   ├── CartPage.js
│   │   ├── CheckoutPage.js
│   │   ├── OrderConfirmationPage.js
│   │   ├── OrderHistoryPage.js
│   │   └── OrderTrackingPage.js
│   ├── styles/
│   ├── utils/
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── .env.local
```

## 🚀 Getting Started

### Prerequisites
- Node.js 14+ and npm

### Installation

1. **Navigate to project folder**:
   ```bash
   cd ecommerce-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

   The app will open at `http://localhost:3000`

### Environment Variables

Create `.env.local` file with:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_API_VERSION=v1
```

## 📝 Pages

### Public Pages

1. **Home** (`/`)
   - Hero section with call-to-actions
   - Featured products grid
   - Features showcase
   - Newsletter signup

2. **Products** (`/products`)
   - Filterable product grid (category, price range)
   - Sorting options (newest, price, rating)
   - Product cards with quick add to cart
   - Responsive mobile-first layout

3. **Product Detail** (`/products/:id`)
   - Large product image gallery
   - Product specifications and features
   - Customer reviews and ratings
   - Related products section
   - Add to cart and wishlist buttons

4. **Shopping Cart** (`/cart`)
   - List of cart items with images
   - Quantity adjustment
   - Remove items
   - Order summary sidebar
   - Proceed to checkout

5. **Checkout** (`/checkout`)
   - Multi-step process: Shipping → Payment → Review
   - Address form with validation
   - Shipping method selection
   - Payment method options (Credit Card, PayPal, Apple Pay)
   - Order review before confirmation

6. **Order Confirmation** (`/order-confirmation/:id`)
   - Success message
   - Order number display
   - Next steps information
   - Contact support options

7. **Order History** (`/orders`)
   - List of user's orders
   - Order status badges
   - Order date, total, items count
   - Quick access to tracking

8. **Order Tracking** (`/order-tracking/:id`)
   - Real-time shipment tracking
   - Timeline of events with locations
   - Shipping address display
   - Items in shipment
   - Estimated delivery date

## 🧩 Components

### Button
```jsx
<Button 
  variant="primary" 
  size="lg" 
  fullWidth 
  loading={false}
>
  Click Me
</Button>
```

**Variants**: `primary`, `secondary`, `danger`, `outline`
**Sizes**: `sm`, `md`, `lg`

### Alert
```jsx
<Alert 
  type="success" 
  message="Success!" 
  onClose={() => {}}
/>
```

**Types**: `success`, `error`, `warning`, `info`

### Badge
```jsx
<Badge variant="primary" size="md">
  New
</Badge>
```

### Spinner
```jsx
<Spinner size="md" fullScreen={false} />
```

### ProductCard
```jsx
<ProductCard 
  product={product} 
  onAddToCart={handleAddToCart}
/>
```

## 🎯 Customization

### Colors
Edit `tailwind.config.js` to customize the color palette:
```js
colors: {
  primary: { ... },
  secondary: { ... },
  // ...
}
```

### Spacing
All components use the 8px grid system. Modify in `tailwind.config.js`:
```js
spacing: {
  xs: '4px',
  sm: '8px',
  // ...
}
```

### Typography
Fonts are configured in `tailwind.config.js`:
```js
fontFamily: {
  sans: ['Inter', 'Nunito', 'system-ui'],
  heading: ['Plus Jakarta Sans', 'Poppins', 'system-ui'],
}
```

## 📦 Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## 🔄 Integration with Backend

### API Endpoints Needed

The frontend expects these backend endpoints:

**Products**:
- `GET /api/v1/products` - List products with pagination and filters
- `GET /api/v1/products/:id` - Get single product
- `GET /api/v1/categories` - Get all categories

**Cart**:
- `POST /api/v1/cart/items` - Add to cart
- `GET /api/v1/cart` - Get cart
- `PUT /api/v1/cart/items/:id` - Update quantity
- `DELETE /api/v1/cart/items/:id` - Remove item

**Orders**:
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/:id` - Get order details
- `GET /api/v1/users/orders` - Get user's orders

**Shipping**:
- `POST /api/v1/shipping/rates` - Get shipping rates
- `GET /api/v1/shipments/:tracking_number` - Track shipment

Update `REACT_APP_API_URL` in `.env.local` to point to your backend.

## 🚀 Deployment

### Deploy to Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Drag and drop build/ folder to Netlify
```

### Deploy to GitHub Pages
```bash
npm run build
# Push build/ to gh-pages branch
```

## 🧪 Testing

(Components ready for unit tests with Jest/React Testing Library)

```bash
npm test
```

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [React Router Docs](https://reactrouter.com)

## 📄 License

MIT License

## 👤 Author

Created using Frontend Design skill guidelines for beautiful e-commerce UI.

---

**Ready to launch?** 🚀 Connect this frontend to the C# ASP.NET Core backend and start taking orders!
