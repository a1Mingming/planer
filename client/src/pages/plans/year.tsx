import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'umi';
import { Button, Skeleton, Result, Progress } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getYearPlans } from '@/services/plan';
import type { YearSummary } from '@/types/plan';
import FabButton from '@/components/FabButton';
import PlanForm from '@/components/PlanForm';
import styles from './year.module.less';

const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

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

  if (error) return (
    <Result status="error" title="加载失败" extra={
      <Button onClick={load}>重试</Button>
    } />
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button type="text" icon={<LeftOutlined />} onClick={() => navigate(`/plans/year/${prevYear}`)} />
        <span className={styles.title}>{currentYear}年</span>
        <Button type="text" icon={<RightOutlined />} onClick={() => navigate(`/plans/year/${nextYear}`)} />
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <div className={styles.grid}>
          {MONTH_NAMES.map((name, i) => {
            const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
            const s = summaryMap[monthKey] ?? { month: monthKey, total: 0, done: 0 };
            const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
            return (
              <div
                key={monthKey}
                className={styles.monthCard}
                onClick={() => navigate(`/plans/month/${monthKey}`)}
              >
                <div className={styles.monthName}>{name}</div>
                <div className={styles.stats}>
                  {s.total === 0 ? (
                    <span className={styles.empty}>暂无计划</span>
                  ) : (
                    <>
                      <span>{s.done}/{s.total}</span>
                      <Progress percent={pct} size="small" showInfo={false} strokeColor="#1677ff" />
                    </>
                  )}
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
