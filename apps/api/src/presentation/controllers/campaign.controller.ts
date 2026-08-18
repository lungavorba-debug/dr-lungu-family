import type { Request, Response, NextFunction } from 'express';
import { listCampaignsAdminQuerySchema } from '@medscreen/shared';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES, CAMPAIGN_STATUSES } from '@medscreen/types';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import {
  activateCampaignUseCase,
  archiveCampaignUseCase,
  auditRecorder,
  closeCampaignUseCase,
  createCampaignUseCase,
  deleteCampaignUseCase,
  getCampaignDashboardSummaryUseCase,
  getCampaignUseCase,
  listActiveCampaignsUseCase,
  listCampaignsAdminUseCase,
  updateCampaignUseCase,
} from '../../infrastructure/container';

export async function listCampaignsController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const campaigns = await listActiveCampaignsUseCase.execute();
    sendSuccess(res, { campaigns }, 'Campaniile active au fost încărcate.');
  } catch (error) {
    next(error);
  }
}

export async function getCampaignController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const isAdmin = req.user?.role === 'ADMIN';
    const campaign = await getCampaignUseCase.execute(id, { admin: isAdmin });
    if (!campaign) {
      next(new AppError(404, 'NOT_FOUND', 'Campania solicitată nu a fost găsită.'));
      return;
    }
    sendSuccess(res, { campaign }, 'Campania a fost încărcată.');
  } catch (error) {
    next(error);
  }
}

export async function getCampaignDashboardSummaryController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const summary = await getCampaignDashboardSummaryUseCase.execute();
    sendSuccess(res, summary, 'Rezumatul campaniilor a fost încărcat.');
  } catch (error) {
    next(error);
  }
}

export async function listCampaignsAdminController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = listCampaignsAdminQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const details = parsed.error.errors.map((issue) => ({
        field: issue.path.join('.') || 'query',
        issue: issue.message,
      }));
      next(new AppError(400, 'INVALID_PARAMETER', 'Parametri de căutare invalizi.', details));
      return;
    }

    const result = await listCampaignsAdminUseCase.execute(parsed.data);
    sendSuccess(res, result, 'Lista campaniilor a fost încărcată.');
  } catch (error) {
    next(error);
  }
}

export async function createCampaignController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await createCampaignUseCase.execute(req.body);

    if (req.user) {
      auditRecorder.recordFromRequest(req, req.user, {
        action: AUDIT_ACTIONS.CAMPAIGN_CREATED,
        entity_type: AUDIT_ENTITY_TYPES.CAMPAIGN,
        entity_id: result.campaign.id,
        description: `Campanie creată: ${result.campaign.name}.`,
      });
    }

    sendSuccess(res, result, 'Campania a fost creată.', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateCampaignController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await updateCampaignUseCase.execute(id, req.body);

    if (req.user) {
      auditRecorder.recordFromRequest(req, req.user, {
        action: AUDIT_ACTIONS.CAMPAIGN_UPDATED,
        entity_type: AUDIT_ENTITY_TYPES.CAMPAIGN,
        entity_id: result.campaign.id,
        description: `Campanie actualizată: ${result.campaign.name}.`,
      });
    }

    sendSuccess(res, result, 'Campania a fost actualizată.');
  } catch (error) {
    next(error);
  }
}

export async function activateCampaignController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const before = await getCampaignUseCase.execute(id, { admin: true });
    const result = await activateCampaignUseCase.execute(id);

    if (
      req.user &&
      before &&
      before.status !== CAMPAIGN_STATUSES.ACTIVE &&
      result.campaign.status === CAMPAIGN_STATUSES.ACTIVE
    ) {
      auditRecorder.recordFromRequest(req, req.user, {
        action: AUDIT_ACTIONS.CAMPAIGN_ACTIVATED,
        entity_type: AUDIT_ENTITY_TYPES.CAMPAIGN,
        entity_id: result.campaign.id,
        description: `Campanie activată: ${result.campaign.name}.`,
      });
    }

    sendSuccess(res, result, 'Campania a fost activată.');
  } catch (error) {
    next(error);
  }
}

export async function closeCampaignController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const before = await getCampaignUseCase.execute(id, { admin: true });
    const result = await closeCampaignUseCase.execute(id);

    if (
      req.user &&
      before &&
      before.status !== CAMPAIGN_STATUSES.CLOSED &&
      result.campaign.status === CAMPAIGN_STATUSES.CLOSED
    ) {
      auditRecorder.recordFromRequest(req, req.user, {
        action: AUDIT_ACTIONS.CAMPAIGN_CLOSED,
        entity_type: AUDIT_ENTITY_TYPES.CAMPAIGN,
        entity_id: result.campaign.id,
        description: `Campanie închisă: ${result.campaign.name}.`,
      });
    }

    sendSuccess(res, result, 'Campania a fost închisă.');
  } catch (error) {
    next(error);
  }
}

export async function archiveCampaignController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const before = await getCampaignUseCase.execute(id, { admin: true });
    const result = await archiveCampaignUseCase.execute(id);

    if (
      req.user &&
      before &&
      before.status !== CAMPAIGN_STATUSES.ARCHIVED &&
      result.campaign.status === CAMPAIGN_STATUSES.ARCHIVED
    ) {
      auditRecorder.recordFromRequest(req, req.user, {
        action: AUDIT_ACTIONS.CAMPAIGN_ARCHIVED,
        entity_type: AUDIT_ENTITY_TYPES.CAMPAIGN,
        entity_id: result.campaign.id,
        description: `Campanie arhivată: ${result.campaign.name}.`,
      });
    }

    sendSuccess(res, result, 'Campania a fost arhivată.');
  } catch (error) {
    next(error);
  }
}

export async function deleteCampaignController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existing = await getCampaignUseCase.execute(id, { admin: true });
    const result = await deleteCampaignUseCase.execute(id);

    if (req.user && existing) {
      auditRecorder.recordFromRequest(req, req.user, {
        action: AUDIT_ACTIONS.CAMPAIGN_DELETED,
        entity_type: AUDIT_ENTITY_TYPES.CAMPAIGN,
        entity_id: id,
        description: `Campanie ștearsă: ${existing.name}.`,
      });
    }

    sendSuccess(res, result, 'Campania a fost ștearsă.');
  } catch (error) {
    next(error);
  }
}
