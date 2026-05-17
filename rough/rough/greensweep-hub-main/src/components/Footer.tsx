import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">EcoClean</span>
            </Link>
            <p className="text-background/70 max-w-md mb-6">
              Empowering citizens to build cleaner, greener cities through 
              community-driven waste management and sustainable rewards.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-background/70">
              <li><Link to="/report" className="hover:text-background transition-colors">Report Garbage</Link></li>
              <li><Link to="/dashboard" className="hover:text-background transition-colors">Dashboard</Link></li>
              <li><Link to="/rewards" className="hover:text-background transition-colors">Rewards</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-background/70">
              <li><a href="#" className="hover:text-background transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-background/20 text-center text-background/50 text-sm">
          <p>© {new Date().getFullYear()} EcoClean. All rights reserved. Building cleaner cities together.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
