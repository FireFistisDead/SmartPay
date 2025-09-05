import { motion } from "framer-motion";
import { Link, Twitter, MessageCircle, Send, Github } from "lucide-react";

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
    { symbol: "ETH", icon: "Ξ" },
    { symbol: "POLYGON", icon: "⬡" },
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
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <Link className="text-white text-sm" />
              </div>
              <span className="text-xl font-bold gradient-text">ChainWork</span>
            </div>
            <p className="text-muted-foreground mb-6" data-testid="text-footer-description">
              The future of freelancing is here. Powered by blockchain, secured by smart contracts, 
              trusted by thousands.
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
              title="Platform"
              links={["How It Works", "Smart Contracts", "Security", "Pricing"]}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <FooterSection
              title="Resources"
              links={["Documentation", "API Reference", "Help Center", "Community"]}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <FooterSection
              title="Company"
              links={["About Us", "Careers", "Privacy Policy", "Terms of Service"]}
            />
          </motion.div>
        </div>

        <div className="border-t border-border mt-12 pt-8">
          <BlockchainTicker />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm" data-testid="text-copyright">
              © 2024 ChainWork. All rights reserved. Built on the blockchain for the future of work.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-sm text-muted-foreground">Powered by</span>
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
