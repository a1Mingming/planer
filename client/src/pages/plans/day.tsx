import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'umi';
import { Button, Skeleton, Result, Empty } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getDayPlans, updatePlan, deletePlan } from '@/services/plan';
import type { Plan } from '@/types/plan';
import PlanCard from '@/components/PlanCard';
import FabButton from '@/components/FabButton';
import PlanForm from '@/components/PlanForm';
import styles from './day.module.less';

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function DayPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const currentDate = date || dayjs().format('YYYY-MM-DD');

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const nowLineRef = useRef<HTMLDivElement>(null);

  const isToday = currentDate === dayjs().format('YYYY-MM-DD');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getDayPlans(currentDate);
      setPlans(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (isToday && nowLineRef.current) {
      nowLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isToday, loading]);

  const prevDate = dayjs(currentDate).subtract(1, 'day').format('YYYY-MM-DD');
  const nextDate = dayjs(currentDate).add(1, 'day').format('YYYY-MM-DD');

  const timedPlans = plans
    .filter((p) => p.start_time)
    .sort((a, b) => (a.start_time! > b.start_time! ? 1 : -1));
  const allDayPlans = plans.filter((p) => !p.start_time)
    .sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));

  const handleToggle = async (id: number, done: boolean) => {
    await updatePlan(id, { done });
    setPlans((prev) => prev.map((p) => p.id === id ? { ...p, done } : p));
  };

  const handleDelete = async (id: number) => {
    await deletePlan(id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const openCreate = () => { setEditPlan(null); setFormOpen(true); };
  const openEdit = (plan: Plan) => { setEditPlan(plan); setFormOpen(true); };

  const nowMinutes = dayjs().hour() * 60 + dayjs().minute();
  const timelineStart = 0;
  const timelineEnd = 24 * 60;

  if (error) return <Result status="error" title="加载失败" extra={<Button onClick={load}>重试</Button>} />;

  return (
    <div className={styles.page}>
      <div className={styles.nav}>
        <Button type="text" icon={<LeftOutlined />} onClick={() => navigate(`/plans/day/${prevDate}`)} />
        <span
          className={styles.navTitle}
          onClick={() => navigate(`/plans/month/${currentDate.slice(0, 7)}`)}
        >
          {dayjs(currentDate).format('YYYY年MM月DD日')}
          {isToday && <span className={styles.todayBadge}>今天</span>}
        </span>
        <Button type="text" icon={<RightOutlined />} onClick={() => navigate(`/plans/day/${nextDate}`)} />
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : plans.length === 0 ? (
        <Empty description="今日暂无计划">
          <Button type="primary" onClick={openCreate}>新建计划</Button>
        </Empty>
      ) : (
        <>
          {timedPlans.length > 0 && (
            <div className={styles.timeline}>
              <div className={styles.timelineInner}>
                {Array.from({ length: 25 }, (_, h) => (
                  <div
                    key={h}
                    className={styles.hourRow}
                    style={{ top: `${(h / 24) * 100}%` }}
                  >
                    <span className={styles.hourLabel}>{String(h).padStart(2, '0')}:00</span>
                    <div className={styles.hourLine} />
                  </div>
                ))}

                {isToday && (
                  <div
                    ref={nowLineRef}
                    className={styles.nowLine}
                    style={{ top: `${((nowMinutes - timelineStart) / (timelineEnd - timelineStart)) * 100}%` }}
                  />
                )}

                {timedPlans.map((plan) => {
                  const start = toMinutes(plan.start_time!);
                  const end = plan.end_time ? toMinutes(plan.end_time) : start + 30;
                  const topPct = ((start - timelineStart) / (timelineEnd - timelineStart)) * 100;
                  const heightPct = ((end - start) / (timelineEnd - timelineStart)) * 100;
                  return (
                    <div
                      key={plan.id}
                      className={`${styles.timeBlock} ${plan.done ? styles.done : ''}`}
                      style={{
                        top: `${topPct}%`,
                        height: `max(${heightPct}%, 28px)`,
                      }}
                    >
                      <div className={styles.blockTitle}>{plan.title}</div>
                      <div className={styles.blockTime}>
                        {plan.start_time}{plan.end_time ? ` - ${plan.end_time}` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {allDayPlans.length > 0 && (
            <div className={styles.allDay}>
              <div className={styles.allDayTitle}>全天</div>
              {allDayPlans.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  onToggleDone={handleToggle}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {timedPlans.map((p) => (
            <div key={`list-${p.id}`} className={styles.timedList}>
              <PlanCard
                plan={p}
                onToggleDone={handleToggle}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </>
      )}

      <FabButton onClick={openCreate} />
      <PlanForm
        open={formOpen}
        plan={editPlan}
        initialDate={currentDate}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
