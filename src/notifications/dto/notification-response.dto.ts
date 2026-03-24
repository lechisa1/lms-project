export class NotificationResponseDto {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata: Record<string, any> | null;
  createdAt: Date;
  readAt: Date | null;
}

export class NotificationListResponseDto {
  notifications: NotificationResponseDto[];
  total: number;
  unreadCount: number;
}
