import { Router } from 'express';
import { TeamController } from './team.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

// All team routes require authentication
router.use(requireAuth);

// All staff can list or view members (needed for ticket assignments)
router.get('/', TeamController.listTeamMembers);
router.get('/:id', TeamController.getTeamMemberById);

// Staff provisioning & deletion restricted to SUPER_ADMIN only
router.post('/', requireRole('SUPER_ADMIN'), TeamController.createTeamMember);
router.patch('/:id', requireRole('SUPER_ADMIN'), TeamController.updateTeamMember);
router.delete('/:id', requireRole('SUPER_ADMIN'), TeamController.deleteTeamMember);

export default router;
