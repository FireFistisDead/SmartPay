import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Code, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function HackathonContext() {
  return (
    <section className="py-20 blockchain-grid">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Badge className="mb-6 px-4 py-2 text-sm font-medium bg-purple-600 text-white border-purple-500">
            🏆 MindSprint 48 Hour Hackathon by Unstop
          </Badge>
          <h2 className="text-5xl font-bold mb-8 gradient-text">
            Built in 48 Hours
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-16">
            A complete decentralized freelance platform conceived, designed, and
            developed during the MindSprint Hackathon
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-4">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">48 Hours</h3>
            <p className="text-muted-foreground text-sm">Development Time</p>
          </motion.div>

          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl mb-4">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">Demo Ready</h3>
            <p className="text-muted-foreground text-sm">Live Prototype</p>
          </motion.div>

          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-2xl mb-4">
              <Code className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">Full Stack</h3>
            <p className="text-muted-foreground text-sm">End-to-End Solution</p>
          </motion.div>

          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">Hackathon</h3>
            <p className="text-muted-foreground text-sm">MindSprint 2025</p>
          </motion.div>
        </div>

        <motion.div 
          className="flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <Badge className="px-4 py-2 bg-green-600/20 text-green-400 border-green-500/30">
            ● Live on Polygon Testnet
          </Badge>
          <Badge className="px-4 py-2 bg-blue-600/20 text-blue-400 border-blue-500/30">
            ● Smart Contracts Deployed
          </Badge>
          <Badge className="px-4 py-2 bg-purple-600/20 text-purple-400 border-purple-500/30">
            ● Frontend Demo Ready
          </Badge>
        </motion.div>
      </div>
    </section>
  );
}
