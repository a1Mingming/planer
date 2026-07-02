import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'umi';
import { Skeleton, Result, Empty, Button, Modal, Radio, Space } from 'antd';
import dayjs from 'dayjs';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { getDayPlans, updatePlan, deletePlan, deletePlanRecurrence } from '@/services/plan';
import type { Plan, RecurrenceScope } from '@/types/plan';
import { isPlanEditable } from '@/types/plan';
import PlanCard from '@/components/PlanCard';
import FabButton from '@/components/FabButton';
import PlanForm from '@/components/PlanForm';
import DraggableTimeBlock from './DraggableTimeBlock';
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
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteScopeTarget, setDeleteScopeTarget] = useState<Plan | null>(null);
  const [deleteScope, setDeleteScope] = useState<RecurrenceScope>('one');
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
    setTogglingId(id);
    await updatePlan(id, { done }).finally(() => setTogglingId(null));
    setPlans((prev) => prev.map((p) => p.id === id ? { ...p, done } : p));
  };

  const handleDelete = async (id: number) => {
    const target = plans.find((p) => p.id === id);
    if (target?.recurrence_group_id) {
      setDeleteScope('one');
      setDeleteScopeTarget(target);
      return;
    }
    setDeletingId(id);
    await deletePlan(id).finally(() => setDeletingId(null));
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDeleteScopeConfirm = async () => {
    if (!deleteScopeTarget) return;
    const { id } = deleteScopeTarget;
    setDeleteScopeTarget(null);
    setDeletingId(id);
    if (deleteScope === 'one') {
      await deletePlan(id).finally(() => setDeletingId(null));
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } else {
      await deletePlanRecurrence(id, deleteScope).finally(() => setDeletingId(null));
      await load();
    }
  };

  const openCreate = () => { setEditPlan(null); setFormOpen(true); };
  const openEdit = (plan: Plan) => {
    if (!isPlanEditable(plan)) return;
    setEditPlan(plan); setFormOpen(true);
  };

  const nowMinutes = dayjs().hour() * 60 + dayjs().minute();
  const timelineEnd = 24 * 60;
  const TIMELINE_PX = 1200; // must match .timelineInner height in CSS

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    const plan = timedPlans.find((p) => p.id === active.id);
    if (!plan) return;

    const minutesPerPx = timelineEnd / TIMELINE_PX;
    const deltaMinutes = Math.round((delta.y * minutesPerPx) / 5) * 5; // snap to 5 min
    if (deltaMinutes === 0) return;

    const startMin = toMinutes(plan.start_time!);
    const endMin = plan.end_time ? toMinutes(plan.end_time) : startMin + 30;
    const duration = endMin - startMin;

    const newStart = Math.max(0, Math.min(startMin + deltaMinutes, timelineEnd - duration));
    const newEnd = newStart + duration;

    const toHHMM = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

    const newStartTime = toHHMM(newStart);
    const newEndTime = plan.end_time ? toHHMM(newEnd) : null;

    setPlans((prev) =>
      prev.map((p) =>
        p.id === plan.id ? { ...p, start_time: newStartTime, end_time: newEndTime } : p,
      ),
    );
    await updatePlan(plan.id, { start_time: newStartTime, end_time: newEndTime });
  };

  if (error) return <Result status="error" title="加载失败" extra={<Button onClick={load}>重试</Button>} />;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <span
          className={styles.dayTitle}
          onClick={() => navigate(`/plans/month/${currentDate.slice(0, 7)}`)}
        >
          {dayjs(currentDate).format('YYYY年MM月DD日')}
          {isToday && <span className={styles.todayBadge}>今天</span>}
        </span>
        <div className={styles.navArrows}>
          <button className={styles.navArrow} onClick={() => navigate(`/plans/day/${prevDate}`)}>‹</button>
          <button className={styles.navArrow} onClick={() => navigate(`/plans/day/${nextDate}`)}>›</button>
        </div>
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
              <DndContext
                sensors={sensors}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                onDragEnd={handleDragEnd}
              >
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
                      style={{ top: `${(nowMinutes / timelineEnd) * 100}%` }}
                    />
                  )}

                  {timedPlans.map((plan) => {
                    const start = toMinutes(plan.start_time!);
                    const end = plan.end_time ? toMinutes(plan.end_time) : start + 30;
                    const topPct = (start / timelineEnd) * 100;
                    const heightPct = ((end - start) / timelineEnd) * 100;
                    return (
                      <DraggableTimeBlock
                        key={plan.id}
                        plan={plan}
                        topPct={topPct}
                        heightPct={heightPct}
                        onEdit={openEdit}
                      />
                    );
                  })}
                </div>
              </DndContext>
            </div>
          )}

          {allDayPlans.length > 0 && (
            <div className={styles.allDay}>
              <div className={styles.sectionTitle}>全天</div>
              {allDayPlans.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  onToggleDone={handleToggle}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  isToggling={togglingId === p.id}
                  isDeleting={deletingId === p.id}
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
                isToggling={togglingId === p.id}
                isDeleting={deletingId === p.id}
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
      <Modal
        title="删除范围"
        open={!!deleteScopeTarget}
        onCancel={() => setDeleteScopeTarget(null)}
        onOk={handleDeleteScopeConfirm}
        okText="确认删除"
        okButtonProps={{ danger: true }}
        cancelText="取消"
        width={320}
      >
        <Radio.Group value={deleteScope} onChange={(e) => setDeleteScope(e.target.value as RecurrenceScope)}>
          <Space direction="vertical">
            <Radio value="one">仅删除此条</Radio>
            <Radio value="future" disabled={!!deleteScopeTarget && !isPlanEditable(deleteScopeTarget)}>删除此条及之后</Radio>
            <Radio value="all" disabled={!!deleteScopeTarget && !isPlanEditable(deleteScopeTarget)}>删除全部</Radio>
          </Space>
        </Radio.Group>
        {deleteScopeTarget && !isPlanEditable(deleteScopeTarget) && (
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            该计划时间已到来，仅可删除此条
          </p>
        )}
      </Modal>
    </div>
  );
}
