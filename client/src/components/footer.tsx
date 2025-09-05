import { motion } from "framer-motion";
import { Wallet, Twitter, MessageCircle, Send, Github } from "lucide-react";

const FooterSection = ({ title, links }: { title: string; links: string[] }) => (
  <div>
    <h3 className="text-lg font-semibold mb-6">{title}</h3>
    <ul className="space-y-3">
      {links.map((link, index) => (
        <li key={index}>
          <a 
            href="#" 
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid={`link-${link.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {link}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const SocialLink = ({ icon, href, testId }: { icon: React.ReactNode; href: string; testId: string }) => (
  <a 
    href={href} 
    className="w-10 h-10 bg-muted/20 rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
    data-testid={testId}
  >
    {icon}
  </a>
);

const BlockchainTicker = () => {
  const items = [
    { symbol: "IPFS", icon: "🗃️" },
    { symbol: "CHAINLINK", icon: "🔗" },
    { symbol: "ARBITRUM", icon: "🔵" }
  ];

  return (
    <div className="mb-8 overflow-hidden">
      <div className="flex space-x-8 animate-scroll">
        {[...items, ...items].map((item, index) => (
          <div key={index} className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-primary">{item.icon}</span>
            <span className="text-sm text-muted-foreground">{item.symbol}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 relative overflow-hidden blockchain-grid">
      <div className="absolute inset-0 blockchain-grid opacity-5"></div>
      
      <div className="container mx-auto px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <Wallet className="text-white text-sm" />
              </div>
              <span className="text-xl font-bold gradient-text">SmartPay</span>
            </div>
            <p className="text-muted-foreground mb-6" data-testid="text-footer-description">
              Decentralized freelance platform built for MindSprint 48 Hour Hackathon. Powered by 
              blockchain, secured by smart contracts.
            </p>
            <div className="flex space-x-4">
              <SocialLink 
                icon={<Twitter className="w-5 h-5" />} 
                href="#" 
                testId="link-twitter" 
              />
              <SocialLink 
                icon={<MessageCircle className="w-5 h-5" />} 
                href="#" 
                testId="link-discord" 
              />
              <SocialLink 
                icon={<Send className="w-5 h-5" />} 
                href="#" 
                testId="link-telegram" 
              />
              <SocialLink 
                icon={<Github className="w-5 h-5" />} 
                href="#" 
                testId="link-github" 
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <FooterSection
              title="Project"
              links={["GitHub Repo", "Documentation", "Demo Video", "Whitepaper"]}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <FooterSection
              title="Hackathon"
              links={["Pitch Deck", "Smart Contracts", "API Reference", "Team"]}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <FooterSection
              title="Resources"
              links={["How It Works", "Technology Stack", "Future Roadmap", "Contact"]}
            />
          </motion.div>
        </div>

        <div className="border-t border-border mt-12 pt-8">
          <BlockchainTicker />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm" data-testid="text-copyright">
              © 2025 SmartPay. Built for MindSprint 48 Hour Hackathon by Unstop.
            </p>
            <p className="text-muted-foreground text-xs mt-2 md:mt-0">
              This project was developed for MindSprint Hackathon 2025
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-sm text-muted-foreground">Powered by Team Galcogens</span>
              <div className="flex space-x-2">
                <div className="w-6 h-6 bg-primary rounded opacity-80"></div>
                <div className="w-6 h-6 bg-secondary rounded opacity-80"></div>
                <div className="w-6 h-6 bg-accent rounded opacity-80"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
