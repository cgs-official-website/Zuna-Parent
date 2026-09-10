import { TeamService } from './team.service.js';
import { createMemberSchema, updateMemberSchema } from './team.validator.js';

export class TeamController {
  static async listTeamMembers(req, res, next) {
    try {
      const members = await TeamService.listTeamMembers();
      return res.status(200).json({
        success: true,
        data: members
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamMemberById(req, res, next) {
    try {
      const { id } = req.params;
      const member = await TeamService.getTeamMemberById(id);
      return res.status(200).json({
        success: true,
        data: member
      });
    } catch (error) {
      next(error);
    }
  }

  static async createTeamMember(req, res, next) {
    try {
      const validated = createMemberSchema.parse(req.body);
      const member = await TeamService.createTeamMember(validated, req.admin);
      return res.status(201).json({
        success: true,
        data: member
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
      }
      next(error);
    }
  }

  static async updateTeamMember(req, res, next) {
    try {
      const { id } = req.params;
      const validated = updateMemberSchema.parse(req.body);
      const updated = await TeamService.updateTeamMember(id, validated);
      return res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
      }
      next(error);
    }
  }

  static async deleteTeamMember(req, res, next) {
    try {
      const { id } = req.params;
      const result = await TeamService.deleteTeamMember(id, req.admin.id);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
