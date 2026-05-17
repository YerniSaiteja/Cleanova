import { Button } from "@/components/ui/button";
import { ArrowRight, Camera, MapPin, Gift, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-nature" />
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-secondary/10 blur-3xl animate-float-delay" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6 animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Making Cities Cleaner Together
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 animate-fade-in-up animation-delay-200">
              Report Waste,{" "}
              <span className="text-gradient-hero">Earn Rewards</span>,{" "}
              Build a Cleaner City
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl mb-8 animate-fade-in-up animation-delay-400">
              Join thousands of eco-conscious citizens making a difference. 
              Snap a photo, share location, and earn eco-points redeemable for 
              sustainable rewards.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up animation-delay-600">
              <Button variant="hero" size="lg" asChild>
                <Link to="/report">
                  Report Garbage
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/rewards">
                  View Rewards
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border">
              <div className="text-center lg:text-left">
                <div className="text-2xl md:text-3xl font-bold text-foreground">12K+</div>
                <div className="text-sm text-muted-foreground">Reports Resolved</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl md:text-3xl font-bold text-foreground">5K+</div>
                <div className="text-sm text-muted-foreground">Active Citizens</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl md:text-3xl font-bold text-foreground">98%</div>
                <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="relative">
            <div className="grid gap-4">
              <FeatureCard
                icon={<Camera className="w-6 h-6" />}
                title="Snap & Report"
                description="Take a photo of uncollected garbage and submit instantly"
                delay="0"
              />
              <FeatureCard
                icon={<MapPin className="w-6 h-6" />}
                title="Auto Location"
                description="GPS automatically captures exact garbage location"
                delay="200"
              />
              <FeatureCard
                icon={<CheckCircle className="w-6 h-6" />}
                title="Verified Reports"
                description="AI verification prevents misuse and fake reports"
                delay="400"
              />
              <FeatureCard
                icon={<Gift className="w-6 h-6" />}
                title="Earn Eco-Points"
                description="Get rewarded with points for every verified report"
                delay="600"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}) => (
  <div
    className={`flex items-start gap-4 p-5 rounded-2xl bg-card shadow-card border border-border hover:shadow-glow transition-all duration-300 animate-fade-in-up`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-primary shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default HeroSection;
