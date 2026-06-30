import { Outlet, useNavigate, useLocation } from 'umi';
import { ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import styles from './index.module.less';

const antdTheme = {
  token: {
    colorPrimary: '#C84B31',
    colorPrimaryHover: '#A83A23',
    colorBgContainer: '#FDFAF7',
    colorBgElevated: '#FDFAF7',
    colorBorder: '#C4BFBA',
    colorBorderSecondary: '#D4CFC9',
    colorText: '#1C1917',
    colorTextSecondary: '#6B6560',
    colorTextPlaceholder: '#C4BFBA',
    borderRadius: 4,
    borderRadiusSM: 3,
    fontFamily: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    fontSize: 14,
    colorFillAlter: '#F7F3EE',
    boxShadow: '0 2px 8px rgba(28,25,23,0.08)',
    boxShadowSecondary: '0 1px 4px rgba(28,25,23,0.06)',
  },
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const today = dayjs().format('YYYY-MM-DD');
  const thisMonth = dayjs().format('YYYY-MM');
  const thisYear = dayjs().format('YYYY');

  const isActive = (prefix: string) => location.pathname.startsWith(prefix);

  return (
    <ConfigProvider theme={antdTheme}>
      <div className={styles.layout}>
        <header className={styles.header}>
          <div className={styles.logo}>日程</div>
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
        </header>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </ConfigProvider>
  );
}
