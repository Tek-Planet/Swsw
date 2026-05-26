import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, Mail, HelpCircle, CreditCard, Ticket, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSubmitContactQuery } from "@/hooks/useContactQueries";
import { useAuth } from "@/contexts/AuthContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Support = () => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const { submitQuery, isSubmitting } = useSubmitContactQuery();
  const { user } = useAuth();

  const faqs = [
    {
      question: "How do I purchase tickets?",
      answer: "Browse events on our homepage, select the event you're interested in, choose your ticket type and quantity, then proceed to checkout. You can pay securely using your credit or debit card through Stripe.",
    },
    {
      question: "Where can I find my tickets after purchase?",
      answer: "After completing your purchase, your tickets will appear in the 'My Tickets' section. You can access this by clicking on your profile or navigating to the My Tickets page. Each ticket includes a QR code for event entry.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit and debit cards through our secure payment partner, Stripe. This includes Visa, Mastercard, American Express, and more. All transactions are processed in INR.",
    },
    {
      question: "Can I get a refund for my tickets?",
      answer: "Refund policies vary by event and are set by the event organizer. Please check the specific event details for refund information. For urgent refund requests, contact our support team with your order details.",
    },
    {
      question: "What is the 10% processing fee?",
      answer: "A 10% processing fee is added to cover payment processing, platform maintenance, and customer support services. This fee is shown clearly before you complete your purchase.",
    },
    {
      question: "How do promo codes work?",
      answer: "If you have a promo code, enter it in the designated field during checkout. Valid promo codes will automatically adjust your total. Some promo codes may have usage limits or be restricted to specific events.",
    },
    {
      question: "I didn't receive my order confirmation",
      answer: "Order confirmations are displayed immediately after purchase and your tickets appear in 'My Tickets'. If you're having trouble finding your order, try logging out and back in, or contact our support team with your email address.",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to submit a support ticket");
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const ticketId = await submitQuery({ subject, message });
    if (ticketId) {
      toast.success("Ticket created! Track it in your Support Tickets page.");
      setSubject("");
      setMessage("");
    } else {
      toast.error("Failed to create ticket. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-24 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Support</h1>
              <p className="text-muted-foreground text-lg">
                We're here to help you have the best experience on Grid
              </p>
            </div>
            {user && (
              <Link to="/support/tickets">
                <Button variant="outline" className="gap-2">
                  <Ticket className="w-4 h-4" />
                  My Tickets
                </Button>
              </Link>
            )}
          </div>

          {/* Quick Help Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {[
              { icon: Ticket, label: "Ticket Issues", desc: "Problems with your tickets" },
              { icon: CreditCard, label: "Payment Help", desc: "Billing and refund queries" },
              { icon: Clock, label: "Quick Response", desc: "24-48 hour reply time" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass rounded-xl p-5 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{item.label}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="glass rounded-xl border-0 px-6 overflow-hidden"
                >
                  <AccordionTrigger className="hover:no-underline py-5 text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Create a Support Ticket</h2>
            </div>

            {!user ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Please log in to create a support ticket.</p>
                <Link to="/auth">
                  <Button>Sign in</Button>
                </Link>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground mb-6">
                  Describe your issue and we'll get back to you. You can track your ticket and continue the conversation.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      className="bg-muted/50 border-border"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue or question in detail..."
                      rows={5}
                      className="bg-muted/50 border-border resize-none"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create Ticket"}
                  </Button>
                </form>
              </>
            )}

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">Or email us directly at:</p>
              <a 
                href="mailto:support@gridapp.com" 
                className="text-primary hover:underline flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                support@gridapp.com
              </a>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <footer className="border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          © 2024 Grid. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Support;
