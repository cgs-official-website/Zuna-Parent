import { Router } from 'express';
import { TeamController } from './team.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

// All team routes require authentication
router.use(requireAuth);

// All staff can list roles or members (needed for ticket assignments & forms)
router.get('/roles', TeamController.listRoles);
router.post('/roles', requireRole('SUPER_ADMIN', 'SUPPORT_LEAD'), TeamController.createRole);
router.get('/', TeamController.listTeamMembers);
router.get('/:id', TeamController.getTeamMemberById);

// Staff provisioning & management allowed for SUPER_ADMIN & SUPPORT_LEAD
router.post('/', requireRole('SUPER_ADMIN', 'SUPPORT_LEAD'), TeamController.createTeamMember);
router.patch('/:id', requireRole('SUPER_ADMIN', 'SUPPORT_LEAD'), TeamController.updateTeamMember);
router.delete('/:id', requireRole('SUPER_ADMIN'), TeamController.deleteTeamMember);

export default router;
