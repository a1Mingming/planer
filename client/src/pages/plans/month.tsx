import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'umi';
import { Calendar, Skeleton, Result, Empty, Button } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { getMonthPlans, updatePlan, deletePlan } from '@/services/plan';
import type { Plan } from '@/types/plan';
import PlanCard from '@/components/PlanCard';
import FabButton from '@/components/FabButton';
import PlanForm from '@/components/PlanForm';
import styles from './month.module.less';

export default function MonthPage() {
  const { month } = useParams<{ month: string }>();
  const navigate = useNavigate();

  const currentMonth = month || dayjs().format('YYYY-MM');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    currentMonth + '-' + dayjs().format('DD')
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [formDate, setFormDate] = useState<string | undefined>();

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getMonthPlans(currentMonth);
      setPlans(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    load();
    setSelectedDate(currentMonth + '-01');
  }, [load, currentMonth]);

  const prevMonth = dayjs(currentMonth).subtract(1, 'month').format('YYYY-MM');
  const nextMonth = dayjs(currentMonth).add(1, 'month').format('YYYY-MM');

  const dayPlans = plans.filter((p) => p.date === selectedDate)
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
      if (a.start_time) return -1;
      if (b.start_time) return 1;
      return 0;
    });

  const dateCellRender = (date: Dayjs) => {
    const key = date.format('YYYY-MM-DD');
    const count = plans.filter((p) => p.date === key).length;
    if (!count) return null;
    return <div className={styles.dot} title={`${count} 个计划`} />;
  };

  const handleToggle = async (id: number, done: boolean) => {
    await updatePlan(id, { done });
    setPlans((prev) => prev.map((p) => p.id === id ? { ...p, done } : p));
  };

  const handleDelete = async (id: number) => {
    await deletePlan(id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const openCreate = (date?: string) => {
    setEditPlan(null);
    setFormDate(date ?? selectedDate);
    setFormOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditPlan(plan);
    setFormDate(undefined);
    setFormOpen(true);
  };

  if (error) return <Result status="error" title="加载失败" extra={<Button onClick={load}>重试</Button>} />;

  const groupedByDate: Record<string, Plan[]> = {};
  plans.forEach((p) => {
    if (!groupedByDate[p.date]) groupedByDate[p.date] = [];
    groupedByDate[p.date].push(p);
  });

  const monthDayjs = dayjs(currentMonth);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <span className={styles.monthTitle}>{monthDayjs.format('YYYY年MM月')}</span>
        <span className={styles.monthSub}>月历</span>
        <div className={styles.navArrows}>
          <button className={styles.navArrow} onClick={() => navigate(`/plans/month/${prevMonth}`)}>‹</button>
          <button className={styles.navArrow} onClick={() => navigate(`/plans/month/${nextMonth}`)}>›</button>
        </div>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : isMobile ? (
        <div>
          <div className={styles.mobilePicker} />
          {Object.keys(groupedByDate).sort().map((date) => (
            <div key={date} className={styles.dateGroup}>
              <div className={styles.dateGroupTitle}>
                {dayjs(date).format('MM月DD日')} &nbsp;({groupedByDate[date].length})
              </div>
              {groupedByDate[date].map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  onToggleDone={handleToggle}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ))}
          {plans.length === 0 && (
            <Empty description="本月暂无计划">
              <Button type="primary" onClick={() => openCreate()}>新建计划</Button>
            </Empty>
          )}
        </div>
      ) : (
        <div className={styles.desktop}>
          <div className={styles.calendarPane}>
            <Calendar
              fullscreen={false}
              value={dayjs(selectedDate)}
              validRange={[
                dayjs(currentMonth).startOf('month'),
                dayjs(currentMonth).endOf('month'),
              ]}
              onSelect={(date) => setSelectedDate(date.format('YYYY-MM-DD'))}
              cellRender={dateCellRender}
              onPanelChange={() => {}}
            />
          </div>
          <div className={styles.listPane}>
            <div className={styles.listHeader}>
              <span className={styles.listDate}>{dayjs(selectedDate).format('MM月DD日')}</span>
              <Button size="small" type="primary" onClick={() => openCreate()}>+ 新建</Button>
            </div>
            {dayPlans.length === 0 ? (
              <Empty description="当日暂无计划">
                <Button type="primary" size="small" onClick={() => openCreate()}>新建计划</Button>
              </Empty>
            ) : (
              dayPlans.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  onToggleDone={handleToggle}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      )}

      <FabButton onClick={() => openCreate()} />
      <PlanForm
        open={formOpen}
        plan={editPlan}
        initialDate={formDate}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
