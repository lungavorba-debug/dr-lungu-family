import type { ScreeningRepository } from '../../domain/repositories/screening.repository';

export class GetScreeningSyncStatusUseCase {
  constructor(private readonly screeningRepository: ScreeningRepository) {}

  async execute(params: { screeningId: string; operatorId: string }) {
    const screening = await this.screeningRepository.findById(params.screeningId);
    if (!screening) {
      return {
        screening_id: params.screeningId,
        exists: false,
        status: null,
        completed_at: null,
        operator_id: null,
        can_accept_completion: true,
        conflict: false,
        conflict_reason: null,
      };
    }

    if (screening.status === 'completed' && screening.completedAt) {
      const sameOperator = screening.operatorId === params.operatorId;
      return {
        screening_id: params.screeningId,
        exists: true,
        status: screening.status,
        completed_at: screening.completedAt.toISOString(),
        operator_id: screening.operatorId,
        can_accept_completion: sameOperator,
        conflict: !sameOperator,
        conflict_reason: sameOperator
          ? null
          : 'Screeningul a fost deja finalizat de un alt operator.',
      };
    }

    const sameOperator = screening.operatorId === params.operatorId;

    return {
      screening_id: params.screeningId,
      exists: true,
      status: screening.status,
      completed_at: screening.completedAt?.toISOString() ?? null,
      operator_id: screening.operatorId,
      can_accept_completion: sameOperator,
      conflict: !sameOperator,
      conflict_reason: sameOperator ? null : 'Screeningul aparține altui operator.',
    };
  }
}
