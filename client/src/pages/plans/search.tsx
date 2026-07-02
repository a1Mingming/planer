import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'umi';
import { Skeleton, Empty, Button } from 'antd';
import { searchPlans, updatePlan, deletePlan } from '@/services/plan';
import type { Plan } from '@/types/plan';
import PlanCard from '@/components/PlanCard';
import PlanForm from '@/components/PlanForm';
import styles from './search.module.less';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') ?? '';

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    searchPlans(q).then(setPlans).finally(() => setLoading(false));
  }, [q]);

  const handleToggle = async (id: number, done: boolean) => {
    setTogglingId(id);
    await updatePlan(id, { done }).finally(() => setTogglingId(null));
    setPlans((prev) => prev.map((p) => p.id === id ? { ...p, done } : p));
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    await deletePlan(id).finally(() => setDeletingId(null));
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const openEdit = (plan: Plan) => { setEditPlan(plan); setFormOpen(true); };

  const reload = () => {
    if (!q) return;
    setLoading(true);
    searchPlans(q).then(setPlans).finally(() => setLoading(false));
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>‹ 返回</button>
        <h2 className={styles.title}>
          搜索 <span className={styles.keyword}>"{q}"</span>
          {!loading && <span className={styles.count}>{plans.length} 条结果</span>}
        </h2>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : plans.length === 0 ? (
        <Empty description={q ? `未找到与"${q}"相关的计划` : '请输入搜索关键词'} />
      ) : (
        <div className={styles.list}>
          {plans.map((p) => (
            <div key={p.id} className={styles.item}>
              <div className={styles.dateLabel}>{p.date}</div>
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
        </div>
      )}

      <PlanForm
        open={formOpen}
        plan={editPlan}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
      />
    </div>
  );
}
