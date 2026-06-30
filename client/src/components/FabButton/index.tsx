import styles from './index.module.less';

interface Props {
  onClick: () => void;
}

export default function FabButton({ onClick }: Props) {
  return (
    <button className={styles.fab} onClick={onClick} aria-label="新建计划">
      +
    </button>
  );
}
