import { Router } from 'express';
import { listAuditLogsController } from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const auditRouter = Router();

auditRouter.get('/', authenticate, authorize('ADMIN'), listAuditLogsController);

export { auditRouter };
