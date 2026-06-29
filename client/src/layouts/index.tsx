import { Outlet, useNavigate, useLocation } from 'umi';
import { Button } from 'antd';
import dayjs from 'dayjs';
import styles from './index.module.less';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const today = dayjs().format('YYYY-MM-DD');
  const thisMonth = dayjs().format('YYYY-MM');
  const thisYear = dayjs().format('YYYY');

  const isActive = (prefix: string) => location.pathname.startsWith(prefix);

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.logo}>计划管理</div>
        <nav className={styles.nav}>
          <Button
            type={isActive('/plans/year') ? 'primary' : 'text'}
            onClick={() => navigate(`/plans/year/${thisYear}`)}
          >
            年
          </Button>
          <Button
            type={isActive('/plans/month') ? 'primary' : 'text'}
            onClick={() => navigate(`/plans/month/${thisMonth}`)}
          >
            月
          </Button>
          <Button
            type={isActive('/plans/day') ? 'primary' : 'text'}
            onClick={() => navigate(`/plans/day/${today}`)}
          >
            日
          </Button>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
