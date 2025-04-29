# Angular Portfolio

A modern, responsive portfolio website built with Angular 18 featuring multiple sections, internationalization support, and PWA capabilities.

## 🚀 Features

- Modern UI/UX with responsive design
- Internationalization (i18n) support for multiple languages (English, Spanish, Arabic)
- Progressive Web App (PWA) functionality
- Interactive project showcase with carousel
- Google Analytics integration
- Lazy loading modules
- Animations and transitions
- Contact form
- Dark/Light theme
- Resume download option

## 🛠️ Tech Stack

- Angular 18.2.13
- Bootstrap 4.5.0
- NgBootstrap 17.0.0
- ngx-translate
- ngx-owl-carousel-o
- AOS (Animate On Scroll)
- Font Awesome 5
- PWA Support
- Google Analytics

## 📁 Project Structure
```
src/
├── app/
│   ├── components/
│   │   ├── games/
│   │   ├── home/
│   │   │   ├── about/
│   │   │   ├── banner/
│   │   │   ├── contact/
│   │   │   ├── jobs/
│   │   │   ├── more-projects/
│   │   │   └── projects/
│   │   └── layout/
│   │       ├── footer/
│   │       └── header/
│   ├── services/
│   │   ├── analytics/
│   │   ├── ipservice/
│   │   └── language/
│   ├── app-routing.module.ts
│   └── app.module.ts
├── assets/
│   ├── cv/
│   ├── fonts/
│   ├── i18n/
│   ├── icons/
│   └── images/
└── environments/
```

## 🚀 Getting Started

### Prerequisites
- Node.js (LTS version)
- npm (Node Package Manager)
- Angular CLI 18.x

### Installation

1. Clone the repository
\`\`\`bash
git clone [repository-url]
cd angular-portfolio
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Start development server
\`\`\`bash
npm start
\`\`\`

The application will be available at `http://localhost:4200/`

### Building for Production

To build the project for production:
\`\`\`bash
npm run build-portfolio
\`\`\`

The build artifacts will be stored in the `dist/` directory.

## 📜 Available Scripts

- `npm start` - Starts development server
- `npm run build` - Builds the project
- `npm run build-portfolio` - Builds the project in production mode
- `npm test` - Executes unit tests
- `npm run lint` - Runs linting
- `npm run e2e` - Runs end-to-end tests

## 🌐 Internationalization

The portfolio supports multiple languages:
- English (default)
- Spanish
- Arabic

Language files are located in `src/assets/i18n/`

## 📱 PWA Support

This portfolio is configured as a Progressive Web App. The service worker configuration can be found in `ngsw-config.json`.

## 📊 Analytics

Google Analytics is integrated. The tracking ID can be configured in the environment files.

## 🎨 Customization

You can customize the portfolio by modifying:
- `src/styles.scss` for global styles
- `src/variables.scss` for theme variables
- Environment files for configuration settings

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details