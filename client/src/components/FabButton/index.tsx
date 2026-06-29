import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styles from './index.module.less';

interface Props {
  onClick: () => void;
}

export default function FabButton({ onClick }: Props) {
  return (
    <Button
      type="primary"
      shape="circle"
      icon={<PlusOutlined />}
      size="large"
      className={styles.fab}
      onClick={onClick}
    />
  );
}
