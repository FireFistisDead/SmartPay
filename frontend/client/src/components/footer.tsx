import { motion, useScroll, useTransform } from "framer-motion";
import { Wallet, Twitter, MessageCircle, Send, Github, ExternalLink, Users, Code, Rocket } from "lucide-react";
import { useRef, useEffect, useState } from "react";

const FooterSection = ({ title, icon, links }: { title: string; icon?: React.ReactNode; links: { name: string; href: string; external?: boolean }[] }) => (
  <div>
    <div className="flex items-center space-x-2 mb-6">
      {icon && <div className="text-primary">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <ul className="space-y-3">
      {links.map((link, index) => (
        <li key={index}>
          <a 
            href={link.href} 
            className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group"
            data-testid={`link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            onClick={link.href.startsWith('#') ? (e) => {
              e.preventDefault();
              const sectionId = link.href.substring(1);
              const element = document.getElementById(sectionId);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            } : undefined}
          >
            <span className="group-hover:translate-x-1 transition-transform duration-200">{link.name}</span>
            {link.external && <ExternalLink className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100" />}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const TeamMember = ({ name, role }: { name: string; role: string }) => (
  <div className="text-left">
    <p className="text-base font-semibold text-foreground mb-1">{name}</p>
    <p className="text-xs text-muted-foreground">{role}</p>
  </div>
);

const SocialLink = ({ icon, href, label, testId }: { icon: React.ReactNode; href: string; label: string; testId: string }) => (
  <a 
    href={href} 
    className="group w-10 h-10 bg-muted/20 rounded-xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110 hover:shadow-lg"
    data-testid={testId}
    target={href.startsWith('http') ? "_blank" : undefined}
    rel={href.startsWith('http') ? "noopener noreferrer" : undefined}
    title={label}
  >
    <div className="group-hover:scale-110 transition-transform duration-200">
      {icon}
    </div>
  </a>
);

const TechBadge = ({ name, icon }: { name: string; icon: string }) => (
  <div className="flex items-center space-x-2 px-3 py-1 bg-muted/20 rounded-full">
    <span className="text-sm">{icon}</span>
    <span className="text-xs text-muted-foreground font-medium">{name}</span>
  </div>
);

// Floating Particle Component
const FloatingParticle = ({ delay = 0 }: { delay?: number }) => {
  return (
    <motion.div
      className="absolute w-1 h-1 bg-primary/30 rounded-full will-change-transform"
      initial={{ 
        x: Math.random() * 100 + "%", 
        y: "100%",
        opacity: 0 
      }}
      whileHover={{ 
        y: "-10%",
        opacity: [0, 0.8, 0],
        scale: [0, 1.2, 0]
      }}
      transition={{
        duration: 1,
        ease: "easeOut"
      }}
    />
  );
};

// Blockchain Grid Background
const BlockchainGrid = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0.7, 1], [0.02, 0.05]);
  
  return (
    <motion.div 
      className="absolute inset-0 pointer-events-none"
      style={{ opacity }}
    >
      <div className="absolute inset-0" 
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite'
        }}
      />
      <style>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>
    </motion.div>
  );
};

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  
  const [particles, setParticles] = useState<number[]>([]);
  
  useEffect(() => {
    setParticles(Array.from({ length: 15 }, (_, i) => i));
  }, []);

  const teamMembers = [
    { name: "Yash Khare", role: "Team Lead" },
    { name: "Ansh Gajera", role: "Frontend & UI/UX" },
    { name: "Harsh Shah", role: "Backend Developer" },
    { name: "Vedant Panchal", role: "Backend Developer" },
    { name: "Path Patel", role: "Backend Developer" },
    { name: "Devansh Panchal", role: "Backend Developer" }
  ];

  const technologies = [
    { name: "Polygon", icon: "🟣" },
    { name: "IPFS", icon: "🗃️" },
    { name: "Chainlink", icon: "🔗" },
    { name: "Arbitrum", icon: "🔵" }
  ];

  return (
    <footer 
      ref={footerRef}
      className="relative overflow-hidden bg-gradient-to-b from-transparent via-background/50 to-background border-t border-border/30"
    >
      {/* Animated Background Layers */}
      <BlockchainGrid />
      
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((_, index) => (
          <FloatingParticle key={index} delay={index * 0.5} />
        ))}
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent pointer-events-none" />
      
      {/* Moving Light Effect */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y }}
      >
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      </motion.div>
      
      <motion.div 
        className="container mx-auto px-6 py-16 relative z-10"
        style={{ opacity }}
      >
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Brand Section - Spans 4 columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-4"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                <Wallet className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold gradient-text">SmartPay</span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed" data-testid="text-footer-description">
              A revolutionary decentralized freelance platform built during the MindSprint 48 Hour Hackathon. 
              Powered by blockchain technology and secured by smart contracts.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-3">
              <SocialLink 
                icon={<Twitter className="w-4 h-4" />} 
                href="#" 
                label="Follow us on Twitter"
                testId="link-twitter" 
              />
              <SocialLink 
                icon={<MessageCircle className="w-4 h-4" />} 
                href="#" 
                label="Join our Discord"
                testId="link-discord" 
              />
              <SocialLink 
                icon={<Send className="w-4 h-4" />} 
                href="#" 
                label="Join our Telegram"
                testId="link-telegram" 
              />
              <SocialLink 
                icon={<Github className="w-4 h-4" />} 
                href="https://github.com/FireFistisDead/SmartPay"
                label="View source code"
                testId="link-github" 
              />
            </div>
          </motion.div>

          {/* Project Section - Spans 2 columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <FooterSection
              title="Project"
              icon={<Code className="w-5 h-5" />}
              links={[
                { name: "GitHub Repository", href: "https://github.com/FireFistisDead/SmartPay", external: true },
                { name: "Documentation", href: "#", external: false },
                { name: "Demo Video", href: "#", external: false },
                { name: "Live Demo", href: "/login", external: false }
              ]}
            />
          </motion.div>

          {/* Resources Section - Spans 2 columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <FooterSection
              title="Resources"
              icon={<Rocket className="w-5 h-5" />}
              links={[
                { name: "How It Works", href: "#how-it-works", external: false },
                { name: "Technology Stack", href: "#technology-stack", external: false },
                { name: "About Project", href: "#about", external: false },
                { name: "Future Roadmap", href: "#future-vision", external: false },
                { name: "Features", href: "#features", external: false }
              ]}
            />
          </motion.div>

          {/* Team Section - Spans 4 columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="lg:col-span-4"
          >
            <div className="flex items-center space-x-2 mb-6">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Team Galcogens</h3>
            </div>
            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
              {teamMembers.map((member, index) => (
                <TeamMember key={index} name={member.name} role={member.role} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border/30 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="flex flex-col lg:flex-row items-center space-y-2 lg:space-y-0 lg:space-x-8">
              <p className="text-muted-foreground text-sm" data-testid="text-copyright">
                © 2025 SmartPay. Built for MindSprint 48 Hour Hackathon by Unstop.
              </p>
              <div className="flex items-center space-x-2">
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Powered by Team Galcogens</span>
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-primary rounded-full opacity-80 animate-pulse"></div>
                <div className="w-3 h-3 bg-secondary rounded-full opacity-80 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="w-3 h-3 bg-accent rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
