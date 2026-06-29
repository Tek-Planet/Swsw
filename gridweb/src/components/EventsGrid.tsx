import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Search, ShieldCheck, Film, Ticket } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Event } from '@/types';
import { formatEventDate } from '@/lib/dateUtils';

interface EventsGridProps {
  events: Event[];
}

const EventsGrid = ({ events }: EventsGridProps) => {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState<string>('all');
  const [type, setType] = useState<string>('all');
  const [tag, setTag] = useState<string>('all');

  const { cities, tags } = useMemo(() => {
    const c = new Set<string>();
    const t = new Set<string>();
    events.forEach((e) => {
      if (e.location?.city) c.add(e.location.city);
      e.tags?.forEach((x) => t.add(x));
    });
    return {
      cities: Array.from(c).sort(),
      tags: Array.from(t).sort(),
    };
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (city !== 'all' && e.location?.city !== city) return false;
      if (type !== 'all' && (e.eventType || 'regular') !== type) return false;
      if (tag !== 'all' && !(e.tags || []).includes(tag)) return false;
      if (q) {
        const hay = `${e.title} ${e.subtitle || ''} ${e.description || ''} ${e.location?.city || ''} ${(e.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, search, city, type, tag]);

  if (events.length === 0) return null;

  return (
    <section className="relative z-10 container mx-auto px-4 lg:px-8 py-16 lg:py-24">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            All Live Events
          </h2>
          <p className="text-muted-foreground mt-2">
            {filtered.length} {filtered.length === 1 ? 'event' : 'events'} available
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/40 border-border/50"
          />
        </div>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="bg-background/40 border-border/50">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="bg-background/40 border-border/50">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="regular">Events</SelectItem>
            <SelectItem value="movie">Movies</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tag} onValueChange={setTag}>
          <SelectTrigger className="bg-background/40 border-border/50">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
          No events match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((event, idx) => {
            const isMovie = event.eventType === 'movie';
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(idx * 0.04, 0.4) }}
              >
                <Link to={`/events/${event.id}`} className="group block h-full">
                  <div className="relative h-full rounded-2xl overflow-hidden border border-border/50 bg-card hover:border-primary/40 hover:scale-[1.02] transition-all duration-300">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={event.coverImageUrl || event.movie?.posterUrl || '/placeholder.svg'}
                        alt={event.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                      <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        {isMovie ? (
                          <Badge className="bg-primary/90 text-primary-foreground border-0 text-[10px] uppercase tracking-wider">
                            <Film className="w-3 h-3 mr-1" /> Movie
                          </Badge>
                        ) : (
                          <Badge className="bg-black/60 text-white border-0 text-[10px] uppercase tracking-wider backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1.5" />
                            Live
                          </Badge>
                        )}
                        {event.isInviteOnly && (
                          <Badge className="bg-black/60 text-primary border-0 text-[10px] backdrop-blur-sm">
                            <ShieldCheck className="w-3 h-3 mr-1" /> Invite
                          </Badge>
                        )}
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                        <h3 className="text-lg font-display font-bold text-white line-clamp-2 group-hover:text-primary transition-colors">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-white/80">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatEventDate(event.startTime, event.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/70">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location?.city || 'TBA'}
                          </span>
                          <span className="flex items-center gap-1 text-primary">
                            <Ticket className="w-3 h-3" /> Book
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default EventsGrid;
