import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';
import {
  NotificationResponseDto,
  NotificationListResponseDto,
} from './dto/notification-response.dto';
import { Notification } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  private mapToResponseDto = (
    notification: Notification,
  ): NotificationResponseDto => {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      metadata: notification.metadata as Record<string, any> | null,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
    };
  };

  async getNotifications(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      isRead?: boolean;
    },
  ): Promise<NotificationListResponseDto> {
    const { page = 1, limit = 20, isRead } = options || {};
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationRepository.findAllByUserId(userId, {
        skip,
        take: limit,
        isRead,
      }),
      this.notificationRepository.findAllByUserId(userId).then((n) => n.length),
      this.notificationRepository.findUnreadCount(userId),
    ]);

    return {
      notifications: notifications.map(this.mapToResponseDto),
      total,
      unreadCount,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.findUnreadCount(userId);
  }

  async getNotificationById(
    id: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findById(id);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.mapToResponseDto(notification);
  }

  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.create({
      title: dto.title,
      message: dto.message,
      type: dto.type,
      user: {
        connect: { id: dto.userId },
      },
      metadata: dto.metadata || {},
    });

    return this.mapToResponseDto(notification);
  }

  async markAsRead(
    id: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findById(id);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.notificationRepository.markAsRead(id);
    return this.mapToResponseDto(updated);
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    return this.notificationRepository.markAllAsRead(userId);
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(id);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.delete(id);
  }

  async deleteAllReadNotifications(userId: string): Promise<{ count: number }> {
    return this.notificationRepository.deleteAllRead(userId);
  }

  // Helper method to create notifications for multiple users (bulk)
  async createBulkNotifications(
    userIds: string[],
    dto: Omit<CreateNotificationDto, 'userId'>,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await Promise.all(
      userIds.map((userId) =>
        this.notificationRepository.create({
          title: dto.title,
          message: dto.message,
          type: dto.type,
          user: { connect: { id: userId } },
          metadata: dto.metadata || {},
        }),
      ),
    );

    return notifications.map(this.mapToResponseDto);
  }
}
