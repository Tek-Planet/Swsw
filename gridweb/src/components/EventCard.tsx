import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Event } from '@/types';
import { formatEventDate } from '@/lib/dateUtils';

interface EventCardProps {
  event: Event;
  index?: number;
  variant?: 'default' | 'large';
}

const EventCard = ({ event, index = 0, variant = 'default' }: EventCardProps) => {

  const isLarge = variant === 'large';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`group relative overflow-hidden rounded-2xl gradient-card border border-border hover:border-primary/30 transition-all duration-500 ${isLarge ? 'h-[500px] flex flex-col' : ''}`}
    >
      {/* Event Image */}
      <div className={`relative overflow-hidden ${isLarge ? 'flex-1' : 'aspect-[16/9]'}`}>
        <img
          src={event.coverImageUrl}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        
        {/* Date Badge */}
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="glass rounded-lg px-3 py-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Live Event</div>
          </div>
          {event.isInviteOnly && (
            <div className="glass rounded-lg px-3 py-2 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary font-medium">Invite Only</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`p-6 space-y-4 ${isLarge ? 'bg-card/80 backdrop-blur-sm' : ''}`}>
        <h3 className={`font-display font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors ${isLarge ? 'text-lg' : 'text-xl md:text-2xl'}`}>
          {event.title}
        </h3>

        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm">
              {formatEventDate(event.startTime, event.endTime)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm">
              {event.location?.city || 'TBA'}
            </span>
          </div>
        </div>

        {!isLarge && (
          <Link to={`/events/${event.id}`}>
            <Button variant="gradient" className="w-full group/btn">
              View Event
              <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </Link>
        )}

        {isLarge && (
          <Link to={`/events/${event.id}`} className="absolute inset-0" aria-label={`View ${event.title}`} />
        )}
      </div>

      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
    </motion.div>
  );
};

export default EventCard;
