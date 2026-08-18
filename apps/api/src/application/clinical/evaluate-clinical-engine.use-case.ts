import type { ClinicalEvaluationRequest, ClinicalEvaluationResult } from '@medscreen/types';

import type { ClinicalEvaluationRequestInput } from '@medscreen/shared';

import { evaluateClinicalEngine } from '@medscreen/shared';

import type { LoadActiveClinicalEngineConfigUseCase } from '../clinical-rules/clinical-rules.use-cases';



export class EvaluateClinicalEngineUseCase {

  constructor(

    private readonly loadActiveClinicalEngineConfigUseCase: LoadActiveClinicalEngineConfigUseCase,

  ) {}



  async execute(input: ClinicalEvaluationRequestInput): Promise<ClinicalEvaluationResult> {

    const config = await this.loadActiveClinicalEngineConfigUseCase.execute();

    return evaluateClinicalEngine(input as ClinicalEvaluationRequest, config);

  }

}

