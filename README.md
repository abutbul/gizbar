# Gizbar - Gathering Treasurer

A privacy-focused, multilingual expense tracker for managing group gatherings and shared expenses.

## 📖 Description

### English

Gizbar is a serverless, client-side expense tracking application designed for managing gatherings and group expenses. Track who paid what, who owes whom, and automatically settle balances. All data is stored locally in your browser with full import/export capabilities. Perfect for trips, events, shared dinners, or any group activity involving shared costs.

### Live demo

A running instance of this branch is available at [https://abutbul.github.io/gizbar/](https://abutbul.github.io/gizbar/) — it is deployed by the GitHub Actions workflow at [https://github.com/abutbul/gizbar/actions/workflows/deploy.yml](https://github.com/abutbul/gizbar/actions/workflows/deploy.yml).

### עברית (Hebrew)

גיזבר היא אפליקציה לצד הלקוח לניהול הוצאות שאינה דורשת שרת, שנועדה לנהל מפגשים והוצאות משותפות בקבוצות. ניתן לעקוב מי שילם על מה, מי חייב למי, ולחשב וליישב יתרות באופן אוטומטי. כל הנתונים נשמרים באופן מקומי בדפדפן ויש אפשרות מלאה לייבוא וייצוא. אידיאלית לטיולים, אירועים, ארוחות משותפות וכל פעילות קבוצתית הכוללת הוצאות משותפות.

### Русский (Russian)

Gizbar — это клиентское приложение для учёта расходов, не требующее серверной части, предназначенное для управления встречами и групповыми расходами. Отслеживайте, кто что оплатил и кто кому должен; балансы рассчитываются и сводятся автоматически. Все данные хранятся локально в браузере с возможностью полного импорта и экспорта. Отлично подходит для поездок, мероприятий, совместных ужинов и других групповых активностей с общими расходами.

## ✨ Features

- 📊 **Gathering Management**: Create and track multiple gatherings/events
- 👥 **Member Tracking**: Add members and track their expenses/payments across gatherings
- 💰 **Balance Calculation**: Automatic calculation of who owes what
- ⚖️ **Settlement**: One-click balance settlement for members
- 📈 **Reports**: Generate CSV reports with date range filtering
- 🌍 **Multilingual**: Full support for English, Hebrew (RTL), and Russian
- 🔒 **Privacy First**: No backend, no tracking, all data stored locally
- 📤 **Import/Export**: Full data portability with base64 encoded exports
- 🌙 **Dark Mode**: Automatic dark/light theme support
- 📱 **Mobile Responsive**: Fully optimized for mobile and desktop with RTL support

## 🔐 Security & Privacy

- **No Backend**: 100% client-side application
- **Your Data, Your Control**: All data stored in browser localStorage
- **No Third-Party Tracking**: Zero external API calls or analytics
- **Portable**: Export your entire dataset anytime as base64
- **Offline Capable**: Works without internet after initial load
- **No Account Required**: Start using immediately, no sign-up needed

## 🛠️ Technical Stack

### Frontend

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling with RTL support
- **Vite** - Build tool (for development)

### Build & Deployment

- **Babel** - Transpilation for production
- **Custom Build Script** - Optimized production builds
- **Static Hosting Ready** - Deploy anywhere (GitHub Pages, Netlify, Vercel, etc.)

### Data Management

- **localStorage API** - Client-side persistence
- **Base64 Encoding** - Import/export functionality
- **JSON Data Structure** - Simple, human-readable format

### Architecture

- **Serverless** - Pure client-side application
- **No Dependencies at Runtime** - Self-contained after build
- **CDN React** - React loaded from CDN in production
- **Component-Based** - Modular, maintainable codebase

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/abutbul/gizbar.git
   cd gizbar
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build for production:

   ```bash
   npm run build
   ```

4. Open `dist/index.html` in your browser or serve the `dist` folder:

   ```bash
   # Using Python
   cd dist && python3 -m http.server 8000
   
   # Using Node.js
   npx serve dist
   ```

## 📁 Project Structure

```bash
gizbar/
├── components/          # React components
│   ├── Button.tsx
│   ├── Header.tsx
│   ├── Modal.tsx
│   ├── GatheringList.tsx
│   ├── GatheringDetail.tsx
│   ├── MemberList.tsx
│   ├── Reports.tsx
│   └── icons/          # Icon components
├── services/
│   └── database.ts     # Data management & localStorage
├── locales/            # Translation files
│   ├── en.json
│   ├── he.json
│   └── ru.json
├── i18n/
│   └── index.ts        # Internationalization logic
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
└── build.js            # Production build script
```

## 🌐 Internationalization

The app features full internationalization support with:

- **RTL Support**: Automatic right-to-left layout for Hebrew
- **Date Formatting**: Locale-aware date displays
- **Dynamic Language Switching**: Change language on the fly
- **Extensible**: Easy to add new languages

## 📊 Data Structure

Data is stored as JSON in localStorage with the following structure:

```typescript
{
  gatherings: [
    {
      id: string,
      description: string,
      status: "open" | "closed",
      createdAt: ISO8601,
      members: [
        {
          memberId: string,
          expenses: [{ id, amount, createdAt }],
          payments: [{ id, amount, createdAt }]
        }
      ]
    }
  ],
  globalMembers: [
    { id: string, name: string }
  ]
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

Built with modern web technologies and a focus on privacy and user control.
