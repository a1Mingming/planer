import { useEffect, useState, useCallback } from 'react';
import {
  Modal, Form, Input, DatePicker, TimePicker, Select, Button, message, Radio, Space, Spin,
} from 'antd';
import dayjs from 'dayjs';
import type { Plan, CreatePlanPayload, RecurrenceType, RecurrenceScope, Tag } from '@/types/plan';
import { createPlan, updatePlan, updatePlanRecurrence, rebuildPlanRecurrence, getPlanRecurrenceCount } from '@/services/plan';
import { getTags, createTag } from '@/services/tag';
import styles from './index.module.less';

interface Props {
  open: boolean;
  initialDate?: string;
  plan?: Plan | null;
  onClose: () => void;
  onSaved: () => void;
}

const WEEKDAYS = [
  { label: '日', value: 0 },
  { label: '一', value: 1 },
  { label: '二', value: 2 },
  { label: '三', value: 3 },
  { label: '四', value: 4 },
  { label: '五', value: 5 },
  { label: '六', value: 6 },
];

export default function PlanForm({ open, initialDate, plan, onClose, onSaved }: Props) {
  const [form] = Form.useForm();
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);
  const [editScope, setEditScope] = useState<RecurrenceScope>('one');
  const [affectedCount, setAffectedCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const isEdit = !!plan;
  const isRecurring = isEdit && !!plan?.recurrence_group_id;

  const fetchAffectedCount = useCallback(async (scope: 'future' | 'all') => {
    if (!plan?.id) return;
    setCountLoading(true);
    try {
      const res = await getPlanRecurrenceCount(plan.id, scope);
      setAffectedCount(res.count);
    } catch {
      setAffectedCount(null);
    } finally {
      setCountLoading(false);
    }
  }, [plan?.id]);

  useEffect(() => {
    if (open) {
      getTags().then(setTags);
      if (plan) {
        const rt = plan.recurrence_type ?? 'none';
        setRecurrenceType(rt);
        form.setFieldsValue({
          title: plan.title,
          date: dayjs(plan.date),
          start_time: plan.start_time ? dayjs(plan.start_time, 'HH:mm') : null,
          end_time: plan.end_time ? dayjs(plan.end_time, 'HH:mm') : null,
          tags: plan.tags,
          done: plan.done,
          priority: plan.priority ?? 1,
          recurrence_type: rt,
          recurrence_days: plan.recurrence_days ?? [],
          recurrence_end_date: plan.recurrence_end_date ? dayjs(plan.recurrence_end_date) : null,
        });
      } else {
        setRecurrenceType('none');
        form.resetFields();
        if (initialDate) form.setFieldValue('date', dayjs(initialDate));
      }
    }
  }, [open, plan, initialDate, form]);

  const buildPayload = (values: ReturnType<typeof form.getFieldsValue>) => {
    const start_time = values.start_time ? (values.start_time as dayjs.Dayjs).format('HH:mm') : undefined;
    const end_time = values.end_time ? (values.end_time as dayjs.Dayjs).format('HH:mm') : undefined;
    return {
      title: values.title as string,
      date: (values.date as dayjs.Dayjs).format('YYYY-MM-DD'),
      start_time,
      end_time,
      tags: (values.tags ?? []) as string[],
      done: (values.done ?? false) as boolean,
      priority: (values.priority ?? 1) as 1 | 2 | 3,
      recurrence_type: (values.recurrence_type ?? 'none') as RecurrenceType,
      recurrence_days: (values.recurrence_days ?? undefined) as number[] | undefined,
      recurrence_end_date: values.recurrence_end_date
        ? (values.recurrence_end_date as dayjs.Dayjs).format('YYYY-MM-DD')
        : undefined,
      recurrence_group_id: undefined as string | undefined,
    };
  };

  const handleSubmit = async () => {
    let values: ReturnType<typeof form.getFieldsValue>;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const start_time = values.start_time ? (values.start_time as dayjs.Dayjs).format('HH:mm') : undefined;
    const end_time = values.end_time ? (values.end_time as dayjs.Dayjs).format('HH:mm') : undefined;

    if (start_time && end_time && end_time <= start_time) {
      form.setFields([{ name: 'end_time', errors: ['结束时间必须晚于开始时间'] }]);
      return;
    }

    const payload = buildPayload(values);

    // 编辑循环计划时弹 scope 选择
    if (isRecurring) {
      setPendingPayload(payload);
      setEditScope('one');
      setAffectedCount(null);
      setScopeModalOpen(true);
      return;
    }

    setSaving(true);
    const promise = isEdit && plan
      ? updatePlan(plan.id, payload)
      : createPlan(payload as CreatePlanPayload);

    await promise
      .then(() => {
        message.success(isEdit ? '计划已更新' : '计划已创建');
        onSaved();
        onClose();
      })
      .finally(() => setSaving(false));
  };

  const handleScopeConfirm = async () => {
    if (!pendingPayload || !plan) return;
    setScopeModalOpen(false);
    setSaving(true);

    const hasRecurrenceChange = isRecurring && editScope !== 'one' && (
      pendingPayload.recurrence_type !== plan.recurrence_type ||
      JSON.stringify(pendingPayload.recurrence_days) !== JSON.stringify(plan.recurrence_days) ||
      pendingPayload.recurrence_end_date !== plan.recurrence_end_date
    );

    try {
      if (hasRecurrenceChange) {
        await rebuildPlanRecurrence(plan.id, {
          scope: editScope as 'future' | 'all',
          title: pendingPayload.title as string,
          start_time: pendingPayload.start_time as string | null,
          end_time: pendingPayload.end_time as string | null,
          tags: pendingPayload.tags as string[],
          priority: pendingPayload.priority as 1 | 2 | 3,
          recurrence_type: pendingPayload.recurrence_type as RecurrenceType,
          recurrence_days: pendingPayload.recurrence_days as number[] | null,
          recurrence_end_date: pendingPayload.recurrence_end_date as string | null,
          date: (pendingPayload.date as string),
        });
      } else {
        await updatePlanRecurrence(plan.id, {
          scope: editScope,
          title: pendingPayload.title as string,
          start_time: pendingPayload.start_time as string | null,
          end_time: pendingPayload.end_time as string | null,
          tags: pendingPayload.tags as string[],
          priority: pendingPayload.priority as 1 | 2 | 3,
        });
      }
      message.success('计划已更新');
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = async () => {
    const name = newTagInput.trim();
    if (!name) return;
    if (name.length > 20) { message.error('标签最多 20 个字符'); return; }
    const tag = await createTag(name);
    setTags((prev) => [...prev, tag]);
    const current: string[] = form.getFieldValue('tags') ?? [];
    form.setFieldValue('tags', [...current, tag.name]);
    setNewTagInput('');
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
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
        className={`${styles.modal} plan-form-modal`}
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
            <DatePicker style={{ width: '100%' }} disabled={isRecurring} />
          </Form.Item>

          <div className={styles.timeRow}>
            <Form.Item name="start_time" label="开始时间" className={styles.timeItem}
              rules={[{ required: true, message: '请选择开始时间' }]}>
              <TimePicker format="HH:mm" minuteStep={5} placeholder="开始" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="end_time" label="结束时间" className={styles.timeItem}
              rules={[{ required: true, message: '请选择结束时间' }]}>
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

          <Form.Item name="priority" label="优先级" initialValue={1}>
            <Select
              options={[
                { value: 1, label: '低' },
                { value: 2, label: '中' },
                { value: 3, label: '高' },
              ]}
            />
          </Form.Item>

          {(!isEdit || isRecurring) && (
            <>
              <Form.Item name="recurrence_type" label="重复" initialValue="none">
                <Select
                  options={[
                    { value: 'none', label: '不重复' },
                    { value: 'daily', label: '每天' },
                    { value: 'weekly', label: '每周' },
                    { value: 'monthly', label: '每月' },
                  ]}
                  disabled={isEdit && editScope === 'one'}
                  onChange={(v) => setRecurrenceType(v as RecurrenceType)}
                />
              </Form.Item>

              {recurrenceType === 'weekly' && (
                <Form.Item name="recurrence_days" label="重复日">
                  <Select
                    mode="multiple"
                    placeholder="选择星期（不选则每天）"
                    options={WEEKDAYS}
                    disabled={isEdit && editScope === 'one'}
                  />
                </Form.Item>
              )}

              {recurrenceType !== 'none' && (
                <Form.Item name="recurrence_end_date" label="结束日期">
                  <DatePicker style={{ width: '100%' }} placeholder="留空则默认 90 天"
                    disabled={isEdit && editScope === 'one'} />
                </Form.Item>
              )}
            </>
          )}

          <div className={styles.footer}>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" loading={saving} disabled={saving} onClick={handleSubmit}>
              {isEdit ? '保存' : '创建'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 循环计划编辑范围选择 */}
      <Modal
        title="修改范围"
        open={scopeModalOpen}
        onCancel={() => setScopeModalOpen(false)}
        onOk={handleScopeConfirm}
        okText="确认"
        cancelText="取消"
        width={320}
        confirmLoading={saving}
      >
        <Radio.Group
          value={editScope}
          onChange={(e) => {
            const v = e.target.value as RecurrenceScope;
            setEditScope(v);
            if (v === 'future' || v === 'all') fetchAffectedCount(v);
            else setAffectedCount(null);
          }}
        >
          <Space direction="vertical">
            <Radio value="one">仅修改此条</Radio>
            <Radio value="future">修改此条及之后</Radio>
            <Radio value="all">修改全部</Radio>
          </Space>
        </Radio.Group>
        {editScope !== 'one' && (
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            {countLoading
              ? <Spin size="small" />
              : affectedCount !== null
                ? <>将影响 <strong>{affectedCount}</strong> 条未来未完成的计划</>
                : '批量修改时日期不变，仅更新标题、时间、标签、优先级'}
          </p>
        )}
        <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
          批量修改时日期不变，仅更新标题、时间、标签、优先级
        </p>
      </Modal>
    </>
  );
}
