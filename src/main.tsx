import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext.tsx'

// Note: We've removed the memwatch-next dependency due to compatibility issues
// with current Node.js version. Memory monitoring can be added later using
// more compatible approaches if needed.

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
