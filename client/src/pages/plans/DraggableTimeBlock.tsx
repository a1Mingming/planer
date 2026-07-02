import { useDraggable } from '@dnd-kit/core';
import type { Plan } from '@/types/plan';
import styles from './day.module.less';

interface Props {
  plan: Plan;
  topPct: number;
  heightPct: number;
  onEdit: (plan: Plan) => void;
}

export default function DraggableTimeBlock({ plan, topPct, heightPct, onEdit }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: plan.id,
  });

  const translateY = transform ? transform.y : 0;

  return (
    <div
      ref={setNodeRef}
      className={`${styles.timeBlock} ${plan.done ? styles.timeBlockDone : ''} ${isDragging ? styles.timeBlockDragging : ''}`}
      style={{
        top: `${topPct}%`,
        height: `max(${heightPct}%, 40px)`,
        transform: `translateY(${translateY}px)`,
        zIndex: isDragging ? 20 : 5,
      }}
      {...listeners}
      {...attributes}
      onClick={() => { if (!isDragging) onEdit(plan); }}
    >
      <div className={styles.blockTitle}>{plan.title}</div>
      <div className={styles.blockTime}>
        {plan.start_time}{plan.end_time ? ` – ${plan.end_time}` : ''}
      </div>
    </div>
  );
}
