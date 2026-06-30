import { useEffect, useState } from 'react';
import {
  Modal, Form, Input, DatePicker, TimePicker, Select, Button, message,
} from 'antd';
import dayjs from 'dayjs';
import type { Plan, CreatePlanPayload, UpdatePlanPayload, Tag } from '@/types/plan';
import { createPlan, updatePlan } from '@/services/plan';
import { getTags, createTag } from '@/services/tag';
import styles from './index.module.less';

interface Props {
  open: boolean;
  initialDate?: string;
  plan?: Plan | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function PlanForm({ open, initialDate, plan, onClose, onSaved }: Props) {
  const [form] = Form.useForm();
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const isEdit = !!plan;

  useEffect(() => {
    if (open) {
      getTags().then(setTags).catch(() => {});
      if (plan) {
        form.setFieldsValue({
          title: plan.title,
          date: dayjs(plan.date),
          start_time: plan.start_time ? dayjs(plan.start_time, 'HH:mm') : null,
          end_time: plan.end_time ? dayjs(plan.end_time, 'HH:mm') : null,
          tags: plan.tags,
          done: plan.done,
        });
      } else {
        form.resetFields();
        if (initialDate) form.setFieldValue('date', dayjs(initialDate));
      }
    }
  }, [open, plan, initialDate, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const start_time = values.start_time ? (values.start_time as dayjs.Dayjs).format('HH:mm') : null;
      const end_time = values.end_time ? (values.end_time as dayjs.Dayjs).format('HH:mm') : null;

      if (start_time && end_time && end_time <= start_time) {
        form.setFields([{ name: 'end_time', errors: ['结束时间必须晚于开始时间'] }]);
        return;
      }

      setSaving(true);
      const payload: CreatePlanPayload = {
        title: values.title,
        date: (values.date as dayjs.Dayjs).format('YYYY-MM-DD'),
        start_time,
        end_time,
        tags: values.tags ?? [],
        done: values.done ?? false,
      };

      if (isEdit && plan) {
        const update: UpdatePlanPayload = payload;
        await updatePlan(plan.id, update);
        message.success('计划已更新');
      } else {
        await createPlan(payload);
        message.success('计划已创建');
      }
      onSaved();
      onClose();
    } catch {
      // validation errors handled by form
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = async () => {
    const name = newTagInput.trim();
    if (!name) return;
    if (name.length > 20) { message.error('标签最多 20 个字符'); return; }
    try {
      const tag = await createTag(name);
      setTags((prev) => [...prev, tag]);
      const current: string[] = form.getFieldValue('tags') ?? [];
      form.setFieldValue('tags', [...current, tag.name]);
      setNewTagInput('');
    } catch {
      message.error('创建标签失败（可能已存在）');
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          <span>{isEdit ? '编辑计划' : '新建计划'}</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">✕</button>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={isMobile ? '100vw' : 480}
      style={isMobile ? { top: 0, padding: 0, maxWidth: '100vw' } : undefined}
      className={styles.modal}
      closeIcon={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" validateTrigger="onBlur">
        <Form.Item
          name="title"
          label="标题"
          rules={[
            { required: true, message: '请输入标题' },
            { max: 100, message: '最多 100 个字符' },
          ]}
        >
          <Input placeholder="计划标题" />
        </Form.Item>

        <Form.Item
          name="date"
          label="日期"
          rules={[{ required: true, message: '请选择日期' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <div className={styles.timeRow}>
          <Form.Item name="start_time" label="开始时间" className={styles.timeItem}>
            <TimePicker format="HH:mm" minuteStep={5} placeholder="开始" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end_time" label="结束时间" className={styles.timeItem}>
            <TimePicker format="HH:mm" minuteStep={5} placeholder="结束" style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item name="tags" label="标签">
          <Select
            mode="multiple"
            placeholder="选择标签"
            options={tags.map((t) => ({ value: t.name, label: t.name }))}
            popupRender={(menu) => (
              <>
                {menu}
                <div className={styles.addTag}>
                  <Input
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="新标签名"
                    maxLength={20}
                    onPressEnter={handleAddTag}
                    size="small"
                  />
                  <Button size="small" onClick={handleAddTag}>添加</Button>
                </div>
              </>
            )}
          />
        </Form.Item>

        <div className={styles.footer}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={saving} onClick={handleSubmit}>
            {isEdit ? '保存' : '创建'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
