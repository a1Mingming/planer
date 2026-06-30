import { useState, useCallback, createContext, useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'umi';
import { ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import styles from './index.module.less';

// ─── Theme Context ────────────────────────────────────────────────
type Theme = 'light' | 'dark';

interface ThemeCtx {
  theme: Theme;
  toggleTheme: (e: React.MouseEvent) => void;
}

export const ThemeContext = createContext<ThemeCtx>({
  theme: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function getInitialTheme(): Theme {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
  }
  return 'light';
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : '');
  localStorage.setItem('theme', t);
}

// ─── Ant Design Token Maps ────────────────────────────────────────
function buildAntdTheme(isDark: boolean) {
  return {
    token: {
      colorPrimary:         isDark ? '#B06BFF' : '#8B5CF6',
      colorPrimaryHover:    isDark ? '#C890FF' : '#7C3AED',
      colorBgContainer:     isDark ? '#160E2A' : '#FAF7FF',
      colorBgElevated:      isDark ? '#1E1038' : '#FFFFFF',
      colorBgTextHover:     isDark ? 'rgba(255,255,255,0.08)' : 'rgba(139,92,246,0.08)',
      colorBgTextActive:    isDark ? 'rgba(255,255,255,0.12)' : 'rgba(139,92,246,0.14)',
      colorBorder:          isDark ? 'rgba(255,255,255,0.12)' : 'rgba(160,100,255,0.2)',
      colorBorderSecondary: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(160,100,255,0.12)',
      colorText:            isDark ? '#F0EEFF' : '#2A1860',
      colorTextSecondary:   isDark ? '#9B8FCC' : '#8B72C8',
      colorTextPlaceholder: isDark ? '#4A3F7A' : '#C4B0EC',
      colorIcon:            isDark ? 'rgba(240,238,255,0.6)' : 'rgba(42,24,96,0.5)',
      colorIconHover:       isDark ? '#F0EEFF' : '#2A1860',
      borderRadius:         12,
      borderRadiusSM:       8,
      fontFamily:           "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      fontSize:             14,
      colorFillAlter:       isDark ? 'rgba(176,107,255,0.08)' : '#F0E8FF',
      boxShadow:            isDark
        ? '0 2px 10px rgba(0,0,0,0.3), 0 0 0 1px rgba(176,107,255,0.1)'
        : '0 2px 10px rgba(42,24,96,0.07), 0 0 0 1px rgba(139,92,246,0.07)',
      boxShadowSecondary: isDark ? '0 1px 4px rgba(0,0,0,0.2)' : '0 1px 4px rgba(42,24,96,0.05)',
    },
  };
}

// ─── Layout ──────────────────────────────────────────────────────
export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const toggleTheme = useCallback((e: React.MouseEvent) => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    const x = e.clientX;
    const y = e.clientY;

    if ('startViewTransition' in document) {
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      // @ts-expect-error — View Transitions API not yet in TS lib
      const vt = document.startViewTransition(() => {
        applyTheme(next);
        setTheme(next);
      });
      vt.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          { duration: 420, easing: 'ease-in', pseudoElement: '::view-transition-new(root)' },
        );
      });
    } else {
      applyTheme(next);
      setTheme(next);
    }
  }, [theme]);

  const today = dayjs().format('YYYY-MM-DD');
  const thisMonth = dayjs().format('YYYY-MM');
  const thisYear = dayjs().format('YYYY');
  const isActive = (prefix: string) => location.pathname.startsWith(prefix);
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ConfigProvider theme={buildAntdTheme(isDark)}>
        <div className={`${styles.layout} ${isDark ? styles.dark : ''}`}>
          <header className={styles.header}>
            <div className={styles.logo}>
              <span className={styles.logoStar}>✦</span>
              日程
            </div>

            <nav className={styles.nav}>
              <button
                className={`${styles.navBtn} ${isActive('/plans/year') ? styles.navBtnActive : ''}`}
                onClick={() => navigate(`/plans/year/${thisYear}`)}
              >
                年览
              </button>
              <button
                className={`${styles.navBtn} ${isActive('/plans/month') ? styles.navBtnActive : ''}`}
                onClick={() => navigate(`/plans/month/${thisMonth}`)}
              >
                月历
              </button>
              <button
                className={`${styles.navBtn} ${isActive('/plans/day') ? styles.navBtnActive : ''}`}
                onClick={() => navigate(`/plans/day/${today}`)}
              >
                日程
              </button>
            </nav>

            <button
              className={styles.themeBtn}
              onClick={toggleTheme}
              aria-label={isDark ? '切换到亮色模式' : '切换到暗色模式'}
            >
              {isDark ? '☀' : '☽'}
            </button>
          </header>

          <main className={styles.main}>
            <Outlet />
          </main>
        </div>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
