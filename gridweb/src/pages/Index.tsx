import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useEvents } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatEventDate } from '@/lib/dateUtils';
import EventsGrid from '@/components/EventsGrid';

const Index = () => {
  const { events, loading } = useEvents();

  return (
    <div className="min-h-screen gradient-hero relative overflow-x-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-glow pointer-events-none" />
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

      <Navbar />

      {/* Hero Section - Full Height Split */}
      <section className="pt-20 lg:pt-24 pb-12 lg:pb-20 flex items-center relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-16 items-center">
            {/* Left - Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 glass px-4 py-2 mt-8 lg:mt-0  rounded-full"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Pre-Launch Access</span>
              </motion.div>

              {/* Small Heading */}
              <p className="text-muted-foreground text-sm tracking-widest uppercase">
                India's Events App
              </p>

              {/* Main Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-[1.1]">
                <span className="text-foreground">MAKING EVENTS</span>
                <br />
                <span className="text-foreground">FUN, EASY</span>
                <br />
                <span className="text-foreground">AND </span>
                <span className="text-gradient">QUICK.</span>
              </h1>

              {/* Subtext */}
              <p className="text-muted-foreground text-lg max-w-md">
                Welcome to your Grid. Discover and book tickets for the most exclusive events in your city.
              </p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap gap-4"
              >
                {events.length > 0 && (
                  <Button variant="gradient" size="lg" asChild>
                    <Link to={`/events/${events[0].id}`}>
                      Get Tickets
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                )}
                <Button variant="glass" size="lg" asChild>
                  <Link to="/auth">
                    Sign Up
                  </Link>
                </Button>
              </motion.div>

              {/* App Download CTAs */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-wrap items-center gap-4"
              >
                <span className="text-sm text-muted-foreground">Download the app:</span>
                <div className="flex gap-3">
                  <a
                    href="https://play.google.com/store/apps/details?id=com.techplanet.grid"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 glass px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.523 2H6.477C5.768 2 5.2 2.768 5.2 3.723V20.277C5.2 21.232 5.768 22 6.477 22H17.523C18.232 22 18.8 21.232 18.8 20.277V3.723C18.8 2.768 18.232 2 17.523 2ZM12 20.5C11.17 20.5 10.5 19.83 10.5 19C10.5 18.17 11.17 17.5 12 17.5C12.83 17.5 13.5 18.17 13.5 19C13.5 19.83 12.83 20.5 12 20.5ZM17 16H7V4H17V16Z"/>
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground leading-none">Get it on</span>
                      <span className="text-sm font-semibold leading-tight">Google Play</span>
                    </div>
                  </a>
                  <a
                    href="https://apps.apple.com/app/gridevents/id6756655953"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 glass px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground leading-none">Download on the</span>
                      <span className="text-sm font-semibold leading-tight">App Store</span>
                    </div>
                  </a>
                </div>
              </motion.div>
            </motion.div>

            {/* Right - Featured Event (static, first upcoming) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative min-w-0 max-w-full"
            >
              {loading ? (
                <div className="flex justify-center items-center h-[500px]">
                  <LoadingSpinner size="lg" text="Loading events..." />
                </div>
              ) : events.length > 0 ? (
                <Link to={`/events/${events[0].id}`} className="block group">
                  <div className="relative rounded-3xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-500">
                    <div className="relative">
                      <img
                        src={events[0].coverImageUrl || '/placeholder.svg'}
                        alt={events[0].title}
                        className="w-full h-auto aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-[1.02] max-w-full"
                      />
                      <div className="absolute top-6 left-6 flex gap-2">
                        <div className="glass rounded-full px-4 py-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs font-medium uppercase tracking-wider">Featured</span>
                        </div>
                        {events[0].isInviteOnly && (
                          <div className="glass rounded-lg px-3 py-2 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-primary" />
                            <span className="text-xs text-primary font-medium">Invite Only</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-4 right-4 flex flex-wrap justify-end gap-2">
                        {events[0].tags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs bg-black/50 text-white backdrop-blur-sm">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-6 lg:p-8 space-y-4 bg-card">
                      <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                        {events[0].title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span className="text-sm">{formatEventDate(events[0].startTime, events[0].endTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="text-sm">{events[0].location?.city || 'TBA'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                        <span>View Event</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                  </div>
                </Link>
              ) : null}
            </motion.div>
          </div>
        </div>
      </section>

      {/* All Events Grid */}
      <EventsGrid events={events} />

      {/* Footer - Minimal */}
      <div className="relative z-10 px-4 lg:px-8 pb-6 pt-4 flex flex-col gap-2 text-xs text-muted-foreground/60 border-t border-border/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} Grid. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
