import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { emailService } from '../../lib/email.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROLES_FILE = path.join(__dirname, 'roles.json');

const DEFAULT_ROLES = [
  { id: 'SUPER_ADMIN', name: 'Super Admin', description: 'Full access to all system settings, staff management, and billing.', baseRole: 'SUPER_ADMIN', isSystem: true },
  { id: 'SUPPORT_LEAD', name: 'Support Lead', description: 'Supervises support engineers, assigns tickets, and handles escalations.', baseRole: 'SUPPORT_LEAD', isSystem: true },
  { id: 'SUPPORT_ENGINEER', name: 'Support Engineer', description: 'Resolves customer support tickets, replies to clients, and updates ticket status.', baseRole: 'SUPPORT_ENGINEER', isSystem: true },
  { id: 'PRODUCT_MANAGER', name: 'Product Manager', description: 'Manages product catalog, tier configurations, and views analytics.', baseRole: 'PRODUCT_MANAGER', isSystem: true }
];

async function readRoles() {
  try {
    const raw = await fs.readFile(ROLES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ROLES;
  } catch {
    return DEFAULT_ROLES;
  }
}

async function writeRoles(roles) {
  try {
    await fs.writeFile(ROLES_FILE, JSON.stringify(roles, null, 2), 'utf-8');
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to persist roles.json');
  }
}

export class TeamService {
  /**
   * List all available roles (default system roles + custom created roles)
   */
  static async listRoles() {
    return readRoles();
  }

  /**
   * Create a new custom role
   */
  static async createRole(data) {
    const roles = await readRoles();
    const normalizedId = 'ROLE_' + data.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');

    const existing = roles.find(
      (r) => r.name.toLowerCase() === data.name.trim().toLowerCase() || r.id === normalizedId
    );
    if (existing) {
      const error = new Error(`Role "${data.name}" already exists.`);
      error.statusCode = 409;
      throw error;
    }

    const newRole = {
      id: normalizedId,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      baseRole: data.baseRole || 'SUPPORT_ENGINEER',
      isSystem: false,
      createdAt: new Date().toISOString()
    };

    roles.push(newRole);
    await writeRoles(roles);
    logger.info({ roleId: newRole.id, name: newRole.name }, 'Created new custom team role');
    return newRole;
  }

  /**
   * List all team members with assigned ticket counts and custom roles
   */
  static async listTeamMembers() {
    const members = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            assignedTickets: true
          }
        }
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }]
    });

    return members.map((m) => {
      let customRole = null;
      if (m.avatarUrl && m.avatarUrl.startsWith('role:')) {
        customRole = m.avatarUrl.replace('role:', '');
      }
      return {
        ...m,
        customRole,
        displayRole: customRole || m.role.replace(/_/g, ' ')
      };
    });
  }

  /**
   * Get single team member by ID
   */
  static async getTeamMemberById(id) {
    const member = await prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            assignedTickets: true
          }
        }
      }
    });

    if (!member) {
      const error = new Error(`Team member with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }

    let customRole = null;
    if (member.avatarUrl && member.avatarUrl.startsWith('role:')) {
      customRole = member.avatarUrl.replace('role:', '');
    }

    return {
      ...member,
      customRole,
      displayRole: customRole || member.role.replace(/_/g, ' ')
    };
  }

  /**
   * Create new team member (with custom role support)
   */
  static async createTeamMember(data, creatorAdmin) {
    const existing = await prisma.admin.findUnique({
      where: { email: data.email }
    });

    if (existing) {
      const error = new Error(`An account with email ${data.email} already exists.`);
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Resolve system baseRole and display customRole
    const allRoles = await readRoles();
    const matchedRole = allRoles.find(
      (r) => r.id === data.role || r.name.toLowerCase() === (data.customRole || data.role).toLowerCase()
    );

    const baseRole = matchedRole
      ? matchedRole.baseRole
      : ['SUPER_ADMIN', 'SUPPORT_LEAD', 'SUPPORT_ENGINEER', 'PRODUCT_MANAGER'].includes(data.role)
      ? data.role
      : 'SUPPORT_ENGINEER';

    const customRoleTitle = matchedRole && !matchedRole.isSystem
      ? matchedRole.name
      : data.customRole || (matchedRole ? matchedRole.name : null);

    const avatarUrl = customRoleTitle ? `role:${customRoleTitle}` : data.avatarUrl || null;

    const member = await prisma.admin.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: baseRole,
        avatarUrl,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true
      }
    });

    const displayRole = customRoleTitle || member.role;

    // Send credentials email via Nodemailer
    try {
      const emailResult = await emailService.sendTeamWelcomeEmail({
        member: { ...member, role: displayRole },
        rawPassword: data.password
      });
      logger.info({ emailResult, recipient: member.email }, 'Team welcome credentials email sent');
    } catch (err) {
      logger.error({ error: err.message, recipient: member.email }, 'Could not send team welcome email');
    }

    logger.info({ memberId: member.id, email: member.email, creator: creatorAdmin?.email }, 'New admin staff created');
    return {
      ...member,
      customRole: customRoleTitle,
      displayRole
    };
  }

  /**
   * Update team member profile, role, status, or reset password
   */
  static async updateTeamMember(id, data) {
    const existing = await this.getTeamMemberById(id);

    const updateData = {};
    if (data.name && data.name.trim()) updateData.name = data.name.trim();
    if (data.email && data.email.trim()) {
      const targetEmail = data.email.toLowerCase().trim();
      if (targetEmail !== existing.email) {
        const conflict = await prisma.admin.findUnique({
          where: { email: targetEmail }
        });
        if (conflict) {
          const error = new Error(`An account with email ${targetEmail} already exists.`);
          error.statusCode = 409;
          throw error;
        }
      }
      updateData.email = targetEmail;
    }

    // Role resolution if changing role
    if (data.role || data.customRole) {
      const allRoles = await readRoles();
      const requestedRole = data.customRole || data.role;
      const matched = allRoles.find(
        (r) => r.id === requestedRole || r.name.toLowerCase() === requestedRole.toLowerCase()
      );

      if (matched) {
        updateData.role = matched.baseRole;
        if (!matched.isSystem) {
          updateData.avatarUrl = `role:${matched.name}`;
        } else {
          updateData.avatarUrl = null;
        }
      } else if (['SUPER_ADMIN', 'SUPPORT_LEAD', 'SUPPORT_ENGINEER', 'PRODUCT_MANAGER'].includes(data.role)) {
        updateData.role = data.role;
        updateData.avatarUrl = null;
      }
    }

    if (data.avatarUrl !== undefined && !updateData.avatarUrl) {
      updateData.avatarUrl = data.avatarUrl;
    }

    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (data.password && data.password.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(data.password.trim(), 10);
    }

    const updated = await prisma.admin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    let customRole = null;
    if (updated.avatarUrl && updated.avatarUrl.startsWith('role:')) {
      customRole = updated.avatarUrl.replace('role:', '');
    }

    return {
      ...updated,
      customRole,
      displayRole: customRole || updated.role.replace(/_/g, ' ')
    };
  }

  /**
   * Delete team member (SUPER_ADMIN only)
   */
  static async deleteTeamMember(id, callerAdminId) {
    if (id === callerAdminId) {
      const error = new Error('You cannot delete your own account.');
      error.statusCode = 400;
      throw error;
    }

    await this.getTeamMemberById(id);

    await prisma.admin.delete({
      where: { id }
    });

    return { id, deleted: true };
  }
}
