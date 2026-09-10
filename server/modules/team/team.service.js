import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { emailService } from '../../lib/email.js';


export class TeamService {
  /**
   * List all team members with assigned ticket counts
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

    return members;
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

    return member;
  }

  /**
   * Create new team member (SUPER_ADMIN only)
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

    const member = await prisma.admin.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        avatarUrl: data.avatarUrl || null,
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

    // Send credentials email via Nodemailer / Resend
    emailService
      .sendTeamWelcomeEmail({ member, rawPassword: data.password })
      .catch((err) => {
        logger.warn({ err: err.message }, 'Could not send team welcome email');
      });

    logger.info({ memberId: member.id, email: member.email, creator: creatorAdmin?.email }, 'New admin staff created');
    return member;
  }

  /**
   * Update team member profile, role, status, or reset password
   */
  static async updateTeamMember(id, data) {
    await this.getTeamMemberById(id);

    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
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

    return updated;
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
