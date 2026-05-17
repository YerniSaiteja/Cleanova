import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Award, ShoppingBag, Loader2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Reward {
  id: number;
  name: string;
  description: string;
  points_required: number;
  image_url: string;
  stock_quantity: number;
  is_available: boolean;
}

const Rewards = () => {
  const { toast } = useToast();
  const [userPoints, setUserPoints] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<number | null>(null);
  const [redemptionCode, setRedemptionCode] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setUserPoints(0);
          setLoading(false);
          return;
        }

        const response = await fetch('http://127.0.0.1:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Update local storage to keep it fresh
          localStorage.setItem('user', JSON.stringify(data.user));
          if (data.user.profile) {
            setUserPoints(data.user.profile.total_eco_points || 0);
          } else {
            setUserPoints(0);
          }
        } else {
          // Fallback to local storage if API fails
          const userData = localStorage.getItem('user');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            setUserPoints(parsedUser.profile?.total_eco_points || 0);
          } else {
            setUserPoints(0);
          }
        }
      } catch (error) {
        console.error("Failed to fetch points", error);
        setUserPoints(0);
      } finally {
        setLoading(false);
      }
    };

    const fetchRewards = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/rewards');
        if (response.ok) {
          const data = await response.json();
          setRewards(data.rewards);
        }
      } catch (error) {
        console.error("Failed to fetch rewards", error);
      }
    };

    fetchPoints();
    fetchRewards();
  }, []);

  const handleRedeem = async (reward: Reward) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Login Required",
        description: "Please login to redeem rewards",
        variant: "destructive",
      });
      return;
    }

    if (userPoints < reward.points_required) {
      toast({
        title: "Insufficient Points",
        description: `You need ${reward.points_required - userPoints} more points to redeem this reward.`,
        variant: "destructive",
      });
      return;
    }

    setRedeeming(reward.id);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/rewards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reward_id: reward.id,
          delivery_address: "Address on profile",
          delivery_contact: "Contact on profile"
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to redeem reward");
      }

      setRedemptionCode(data.redemption.redemption_code);
      setIsDialogOpen(true);
      setUserPoints(data.remaining_points);
    } catch (error: any) {
      toast({
        title: "Redemption Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRedeeming(null);
    }
  };

  const copyToClipboard = () => {
    if (redemptionCode) {
      navigator.clipboard.writeText(redemptionCode);
      toast({
        title: "Copied!",
        description: "Redemption code copied to clipboard",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-nature">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
              Rewards Marketplace
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Redeem Your Eco-Points
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Turn your contributions into sustainable rewards. Every point earned
              helps you get closer to eco-friendly products.
            </p>
          </div>

          {/* Points Balance */}
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border mb-10 max-w-md mx-auto relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-points flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <Award className="w-8 h-8 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Balance</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-gradient-points animate-fade-in">{userPoints}</p>
                  <span className="text-sm text-muted-foreground">Points</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rewards Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="bg-card rounded-2xl overflow-hidden shadow-card border border-border hover:shadow-glow transition-all duration-300 group flex flex-col h-full"
                >
                  <div className="h-48 bg-accent/30 relative overflow-hidden">
                    <img
                      src={reward.image_url}
                      alt={reward.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {!reward.is_available && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">Out of Stock</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-semibold text-foreground mb-1 text-lg group-hover:text-primary transition-colors">{reward.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                      {reward.description}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                      <span className="font-bold text-secondary text-lg">{reward.points_required} pts</span>
                      <Button
                        variant={userPoints >= reward.points_required ? "hero" : "outline"}
                        size="sm"
                        onClick={() => handleRedeem(reward)}
                        disabled={!reward.is_available || redeeming === reward.id}
                      >
                        {redeeming === reward.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Redeem
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Success Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-6 h-6" />
                Redemption Successful!
              </DialogTitle>
              <DialogDescription>
                You have successfully redeemed this reward. Please give this code to the redemption center.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 bg-muted p-4 rounded-lg my-4">
              <div className="grid flex-1 gap-2">
                <p className="text-sm font-medium text-muted-foreground">Redemption Code</p>
                <code className="text-lg font-mono font-bold text-foreground tracking-wider">
                  {redemptionCode}
                </code>
              </div>
              <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
                <span className="sr-only">Copy</span>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <DialogFooter className="sm:justify-start">
              <p className="text-xs text-muted-foreground w-full text-center">
                A copy of this code has been saved to your profile history.
              </p>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
      <Footer />
    </div>
  );
};
import { CheckCircle } from "lucide-react";

export default Rewards;
