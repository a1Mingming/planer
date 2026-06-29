export class PlanNotFoundError extends Error {
  readonly code = 'PLAN_NOT_FOUND';
  constructor(id: number) {
    super(`Plan with id ${id} not found`);
    this.name = 'PlanNotFoundError';
  }
}
