import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'umi';
import { Skeleton, Result, Button } from 'antd';
import dayjs from 'dayjs';
import { getYearPlans } from '@/services/plan';
import type { YearSummary } from '@/types/plan';
import FabButton from '@/components/FabButton';
import PlanForm from '@/components/PlanForm';
import styles from './year.module.less';

const MONTH_NAMES = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];

interface RingProps {
  pct: number;
  size?: number;
}

function RingProgress({ pct, size = 44 }: RingProps) {
  const r = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg
      width={size}
      height={size}
      className={styles.ring}
      style={{ transform: 'rotate(-90deg)' }}
      aria-hidden="true"
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--text-faint)" strokeWidth="2.5" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={pct === 100 ? 'var(--mint)' : 'var(--purple)'}
        strokeWidth="2.5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.4s ease' }}
      />
    </svg>
  );
}

export default function YearPage() {
  const { year } = useParams<{ year: string }>();
  const navigate = useNavigate();
  const currentYear = year || dayjs().format('YYYY');

  const [summaries, setSummaries] = useState<YearSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getYearPlans(currentYear);
      setSummaries(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  useEffect(() => { load(); }, [load]);

  const prevYear = String(Number(currentYear) - 1);
  const nextYear = String(Number(currentYear) + 1);

  const summaryMap: Record<string, YearSummary> = {};
  summaries.forEach((s) => { summaryMap[s.month] = s; });

  const thisMonth = dayjs().format('YYYY-MM');

  if (error) return (
    <Result status="error" title="加载失败" extra={<Button onClick={load}>重试</Button>} />
  );

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <span className={styles.yearNum}>{currentYear}</span>
        <span className={styles.yearLabel}>年览</span>
        <div className={styles.navArrows}>
          <button className={styles.navArrow} onClick={() => navigate(`/plans/year/${prevYear}`)}>‹</button>
          <button className={styles.navArrow} onClick={() => navigate(`/plans/year/${nextYear}`)}>›</button>
        </div>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <div className={styles.grid}>
          {MONTH_NAMES.map((name, i) => {
            const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
            const s = summaryMap[monthKey] ?? { month: monthKey, total: 0, done: 0 };
            const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
            const isCurrentMonth = monthKey === thisMonth;
            return (
              <div
                key={monthKey}
                className={`${styles.monthCard} ${isCurrentMonth ? styles.monthCardActive : ''}`}
                onClick={() => navigate(`/plans/month/${monthKey}`)}
              >
                <div className={styles.monthTop}>
                  <div>
                    <div className={styles.monthName}>{name}</div>
                    <div className={styles.monthNum}>{i + 1} / 12</div>
                  </div>
                </div>
                <div className={styles.ringWrap}>
                  {s.total === 0 ? (
                    <span className={styles.emptyLabel}>无计划</span>
                  ) : (
                    <div className={styles.statsText}>
                      <div className={styles.statsDone}>{s.done}</div>
                      <div className={styles.statsTotal}>/ {s.total}</div>
                    </div>
                  )}
                  <RingProgress pct={pct} size={44} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FabButton onClick={() => setFormOpen(true)} />
      <PlanForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={load} />
    </div>
  );
}
