import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanService } from '../../../application/PlanService';
import type { IPlanRepository } from '../../../domain/plan/IPlanRepository';
import type { Plan, CreatePlanDto } from '../../../domain/plan/Plan';
import { PlanNotFoundError } from '../../../domain/plan/PlanErrors';

const mockPlan: Plan = {
  id: 1,
  title: '测试计划',
  date: '2026-06-29',
  start_time: '09:00',
  end_time: '10:00',
  tags: ['工作'],
  done: false,
  priority: 1,
  recurrence_type: 'none',
  recurrence_days: null,
  recurrence_end_date: null,
  recurrence_group_id: null,
  created_at: '2026-06-29 00:00:00',
  updated_at: '2026-06-29 00:00:00',
};

function makeMockRepo(overrides: Partial<IPlanRepository> = {}): IPlanRepository {
  return {
    findByView: vi.fn().mockReturnValue([]),
    findById: vi.fn().mockReturnValue(null),
    search: vi.fn().mockReturnValue([]),
    create: vi.fn().mockReturnValue(mockPlan),
    createBatch: vi.fn().mockReturnValue([mockPlan]),
    update: vi.fn().mockReturnValue(mockPlan),
    updateByGroup: vi.fn(),
    delete: vi.fn().mockReturnValue(true),
    deleteByGroup: vi.fn(),
    countByGroup: vi.fn().mockReturnValue(0),
    getYearSummary: vi.fn().mockReturnValue([]),
    ...overrides,
  };
}

describe('PlanService', () => {
  let repo: IPlanRepository;
  let service: PlanService;

  beforeEach(() => {
    repo = makeMockRepo();
    service = new PlanService(repo);
  });

  describe('getPlans', () => {
    it('calls getYearSummary when view is year', () => {
      service.getPlans('year', '2026');
      expect(repo.getYearSummary).toHaveBeenCalledWith('2026');
      expect(repo.findByView).not.toHaveBeenCalled();
    });

    it('calls findByView when view is month', () => {
      service.getPlans('month', '2026-06');
      expect(repo.findByView).toHaveBeenCalledWith('month', '2026-06');
    });

    it('calls findByView when view is day', () => {
      service.getPlans('day', '2026-06-29');
      expect(repo.findByView).toHaveBeenCalledWith('day', '2026-06-29');
    });

    it('returns year summary array for year view', () => {
      const summary = [{ month: '2026-06', total: 5, done: 3 }];
      (repo.getYearSummary as ReturnType<typeof vi.fn>).mockReturnValue(summary);
      expect(service.getPlans('year', '2026')).toEqual(summary);
    });
  });

  describe('getPlan', () => {
    it('returns plan when found', () => {
      (repo.findById as ReturnType<typeof vi.fn>).mockReturnValue(mockPlan);
      expect(service.getPlan(1)).toEqual(mockPlan);
    });

    it('throws PlanNotFoundError when not found', () => {
      (repo.findById as ReturnType<typeof vi.fn>).mockReturnValue(null);
      expect(() => service.getPlan(99)).toThrow(PlanNotFoundError);
      expect(() => service.getPlan(99)).toThrow('99');
    });
  });

  describe('createPlan', () => {
    it('delegates to repo.create and returns result', () => {
      const dto: CreatePlanDto = {
        title: '新计划',
        date: '2026-06-29',
        start_time: '09:00',
        end_time: '10:00',
        tags: [],
        done: false,
        priority: 1,
        recurrence_type: 'none',
        recurrence_days: null,
        recurrence_end_date: null,
        recurrence_group_id: null,
      };
      const result = service.createPlan(dto);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockPlan);
    });
  });

  describe('updatePlan', () => {
    it('returns updated plan when found', () => {
      (repo.update as ReturnType<typeof vi.fn>).mockReturnValue(mockPlan);
      const result = service.updatePlan(1, { title: '修改标题' });
      expect(repo.update).toHaveBeenCalledWith(1, { title: '修改标题' });
      expect(result).toEqual(mockPlan);
    });

    it('throws PlanNotFoundError when repo.update returns null', () => {
      (repo.update as ReturnType<typeof vi.fn>).mockReturnValue(null);
      expect(() => service.updatePlan(99, { title: '修改' })).toThrow(PlanNotFoundError);
    });
  });

  describe('deletePlan', () => {
    it('calls repo.delete without throwing when plan exists', () => {
      (repo.delete as ReturnType<typeof vi.fn>).mockReturnValue(true);
      expect(() => service.deletePlan(1)).not.toThrow();
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it('throws PlanNotFoundError when repo.delete returns false', () => {
      (repo.delete as ReturnType<typeof vi.fn>).mockReturnValue(false);
      expect(() => service.deletePlan(99)).toThrow(PlanNotFoundError);
    });
  });
});
