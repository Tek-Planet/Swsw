import { motion } from "framer-motion";
import { ArrowLeft, Shield, Eye, Database, Lock, UserCheck, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: Database,
      title: "Information We Collect",
      content: [
        "Account information: email address, name, and profile details when you create an account",
        "Payment information: processed securely through Stripe; we do not store your card details",
        "Event attendance: tickets purchased and events attended through Grid",
        "Usage data: how you interact with our app to improve your experience",
      ],
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      content: [
        "Process ticket purchases and deliver your tickets digitally",
        "Send order confirmations and event updates",
        "Provide customer support and respond to inquiries",
        "Improve our services and develop new features",
        "Comply with legal obligations and prevent fraud",
      ],
    },
    {
      icon: Lock,
      title: "Data Security",
      content: [
        "All data is encrypted in transit using TLS/SSL protocols",
        "Payment processing handled by PCI-compliant Stripe",
        "Firebase Authentication secures your account access",
        "Regular security audits and monitoring",
      ],
    },
    {
      icon: UserCheck,
      title: "Your Rights",
      content: [
        "Access and download your personal data at any time",
        "Request correction of inaccurate information",
        "Delete your account and associated data",
        "Opt out of marketing communications",
        "Lodge a complaint with your local data protection authority",
      ],
    },
    {
      icon: Shield,
      title: "Data Sharing",
      content: [
        "Event organizers receive necessary attendee information for events you attend",
        "Payment processors (Stripe) to complete transactions",
        "Service providers who assist in operating our platform",
        "We never sell your personal data to third parties",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
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

          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground text-lg">
              Last updated: December 2024
            </p>
          </div>

          <div className="glass rounded-2xl p-6 md:p-8 mb-8">
            <p className="text-foreground/90 leading-relaxed">
              At Grid, we take your privacy seriously. This policy explains how we collect, 
              use, and protect your personal information when you use our event ticketing 
              platform. By using Grid, you agree to the collection and use of information 
              in accordance with this policy.
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass rounded-2xl p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                </div>
                <ul className="space-y-3">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 glass rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Contact Us</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              If you have any questions about this Privacy Policy or our data practices, 
              please contact us:
            </p>
            <a 
              href="mailto:privacy@gridapp.com" 
              className="text-primary hover:underline"
            >
              privacy@gridapp.com
            </a>
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

export default PrivacyPolicy;
