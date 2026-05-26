import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { useUserNotifications, UserNotification } from '@/hooks/useUserNotifications';
import { useNavigate } from 'react-router-dom';

export const NotificationBell = () => {
  const { notifications, loading, error, markNotificationAsRead } = useUserNotifications();
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notification: UserNotification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return `${Math.floor(seconds)}s ago`;
  };

  const NotificationItem = ({ notification }: { notification: UserNotification }) => (
    <DropdownMenuItem
      key={notification.id}
      className={`flex items-start whitespace-normal gap-3 cursor-pointer ${notification.read ? 'text-muted-foreground' : ''}`}
      onSelect={(e) => {
        e.preventDefault();
        handleNotificationClick(notification);
      }}
    >
      <div className="w-2 pt-1.5">
        {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-500" />}
      </div>
      <div className="flex flex-col grow">
        <p className={`text-sm font-medium ${notification.read ? '' : 'font-bold'}`}>
          {notification.title || 'New Notification'}
        </p>
        <p className="text-sm">{notification.message}</p>
        <p className="text-xs text-muted-foreground self-end mt-1">
          {formatTimestamp(notification.timestamp)}
        </p>
      </div>
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {loading ? (
            <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
          ) : error ? (
            <DropdownMenuItem disabled>Error loading notifications</DropdownMenuItem>
          ) : notifications.length === 0 ? (
            <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
          ) : (
            notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
