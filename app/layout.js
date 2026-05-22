import "./globals.css";
import { SakuraCanvas } from "@/components/sakura-canvas";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "三国杀台词鉴赏",
  description: "面向浏览与直达访问的三国杀台词鉴赏多页面展示站。",
};

const themeBootScript = `(function () {
  try {
    var stored = window.localStorage.getItem('sgs-quote-theme');
    var theme = stored === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
  } catch (_error) {
    document.documentElement.dataset.theme = 'light';
  }
})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <div className="page-frame">
          <SakuraCanvas />
          <ThemeToggle />
          {children}
        </div>
      </body>
    </html>
  );
}
