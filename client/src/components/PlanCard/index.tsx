import { Tag, Checkbox, Popconfirm, Button } from 'antd';
import { EditOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { Plan } from '@/types/plan';
import styles from './index.module.less';

interface Props {
  plan: Plan;
  onToggleDone: (id: number, done: boolean) => void;
  onEdit: (plan: Plan) => void;
  onDelete: (id: number) => void;
}

const TAG_COLORS = ['blue', 'green', 'orange', 'purple', 'cyan', 'magenta'];

function tagColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export default function PlanCard({ plan, onToggleDone, onEdit, onDelete }: Props) {
  const visibleTags = plan.tags.slice(0, 3);
  const hiddenCount = plan.tags.length - 3;

  return (
    <div className={`${styles.card} ${plan.done ? styles.done : ''}`}>
      <div className={styles.top}>
        <Checkbox
          checked={plan.done}
          onChange={(e) => onToggleDone(plan.id, e.target.checked)}
        />
        <span className={styles.title}>{plan.title}</span>
        <div className={styles.actions}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(plan)}
          />
          <Popconfirm
            title="确认删除该计划？"
            onConfirm={() => onDelete(plan.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="text" size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </div>
      </div>
      {(plan.start_time || plan.tags.length > 0) && (
        <div className={styles.meta}>
          {plan.start_time && (
            <span className={styles.time}>
              <ClockCircleOutlined />
              {plan.start_time}
              {plan.end_time ? ` - ${plan.end_time}` : ''}
            </span>
          )}
          <div className={styles.tags}>
            {visibleTags.map((t) => (
              <Tag key={t} color={tagColor(t)}>{t}</Tag>
            ))}
            {hiddenCount > 0 && <Tag>+{hiddenCount}</Tag>}
          </div>
        </div>
      )}
    </div>
  );
}
