import { Recycle, Users, TreePine, Award } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      step: "01",
      icon: <Recycle className="w-8 h-8" />,
      title: "Spot Garbage",
      description: "Find uncollected waste in your neighborhood that needs attention",
    },
    {
      step: "02",
      icon: <Users className="w-8 h-8" />,
      title: "Report It",
      description: "Upload a photo and let GPS capture the exact location automatically",
    },
    {
      step: "03",
      icon: <TreePine className="w-8 h-8" />,
      title: "Get Verified",
      description: "Our AI system verifies the report to ensure authenticity",
    },
    {
      step: "04",
      icon: <Award className="w-8 h-8" />,
      title: "Earn Points",
      description: "Receive eco-points and redeem them for sustainable rewards",
    },
  ];

  return (
    <section className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Four Simple Steps to a Cleaner City
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join the movement and contribute to a cleaner, greener environment 
            while earning rewards for your efforts.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="relative group"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-border -translate-x-1/2 z-0" />
              )}
              
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-3xl bg-gradient-nature border-2 border-border group-hover:border-primary group-hover:shadow-glow transition-all duration-300 mb-6">
                  <div className="text-primary">{item.icon}</div>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
