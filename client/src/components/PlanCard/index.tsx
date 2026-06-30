import { Popconfirm } from 'antd';
import type { Plan } from '@/types/plan';
import styles from './index.module.less';

interface Props {
  plan: Plan;
  onToggleDone: (id: number, done: boolean) => void;
  onEdit: (plan: Plan) => void;
  onDelete: (id: number) => void;
}

const TAG_PALETTE = [
  '#8B5CF6', '#F472B6', '#34D399', '#60A5FA', '#FBBF24', '#A78BFA',
];

function tagColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
}

export default function PlanCard({ plan, onToggleDone, onEdit, onDelete }: Props) {
  const visibleTags = plan.tags.slice(0, 3);
  const hiddenCount = plan.tags.length - 3;

  return (
    <div className={`${styles.card} ${plan.done ? styles.done : ''}`}>
      <div className={styles.top}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={plan.done}
          onChange={(e) => onToggleDone(plan.id, e.target.checked)}
        />
        <span className={styles.title}>{plan.title}</span>
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={() => onEdit(plan)} title="编辑">
            ✎
          </button>
          <Popconfirm
            title="确认删除该计划？"
            onConfirm={() => onDelete(plan.id)}
            okText="删除"
            cancelText="取消"
          >
            <button className={`${styles.actionBtn} ${styles.danger}`} title="删除">
              ✕
            </button>
          </Popconfirm>
        </div>
      </div>
      {(plan.start_time || plan.tags.length > 0) && (
        <div className={styles.meta}>
          {plan.start_time && (
            <span className={styles.time}>
              {plan.start_time}
              {plan.end_time ? ` – ${plan.end_time}` : ''}
            </span>
          )}
          <div className={styles.tags}>
            {visibleTags.map((t) => (
              <span
                key={t}
                className={styles.tag}
                style={{ borderColor: tagColor(t), color: tagColor(t) }}
              >
                {t}
              </span>
            ))}
            {hiddenCount > 0 && <span className={styles.tagMore}>+{hiddenCount}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
