import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
  };
}

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Request() req: AuthenticatedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('isRead') isRead?: string,
  ) {
    const isReadFilter =
      isRead === 'true' ? true : isRead === 'false' ? false : undefined;

    return this.notificationsService.getNotifications(req.user.userId, {
      page,
      limit,
      isRead: isReadFilter,
    });
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: AuthenticatedRequest) {
    const count = await this.notificationsService.getUnreadCount(
      req.user.userId,
    );
    return { count };
  }

  @Get(':id')
  async getNotification(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.notificationsService.getNotificationById(id, req.user.userId);
  }

  @Post()
  async createNotification(
    @Request() req: AuthenticatedRequest,
    dto: CreateNotificationDto,
  ) {
    // If userId is not provided, use the current user's ID
    if (!dto.userId) {
      dto.userId = req.user.userId;
    }
    return this.notificationsService.createNotification(dto);
  }

  @Post(':id/read')
  async markAsRead(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Post('read-all')
  async markAllAsRead(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Delete(':id')
  async deleteNotification(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    await this.notificationsService.deleteNotification(id, req.user.userId);
    return { success: true };
  }

  @Delete('read/delete-all')
  async deleteAllRead(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.deleteAllReadNotifications(
      req.user.userId,
    );
  }
}
