import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Package } from "lucide-react";

interface Redemption {
  id: number;
  citizen_name: string;
  reward_name: string;
  redemption_code: string;
  points_used: number;
  status: string;
  delivery_address: string;
  delivery_contact: string;
  requested_at: string;
}

const AdminRedemptions = () => {
  const { toast } = useToast();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchRedemptions();
  }, []);

  const fetchRedemptions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:5000/api/rewards/redemptions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRedemptions(data.redemptions);
      } else {
        throw new Error("Failed to fetch redemptions");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load redemptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRedemptionStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://127.0.0.1:5000/api/rewards/redemptions/${id}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Redemption ${status}`,
        });
        fetchRedemptions(); // Refresh the list
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update redemption status",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "delivered":
        return <Package className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      delivered: "outline",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-nature">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center">Loading redemptions...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-nature">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Redemption Management</h1>
            <p className="text-muted-foreground">
              Manage reward redemptions and verify codes
            </p>
          </div>

          <div className="grid gap-6">
            {redemptions.map((redemption) => (
              <Card key={redemption.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {redemption.reward_name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(redemption.status)}
                      {getStatusBadge(redemption.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Citizen</p>
                      <p className="font-medium">{redemption.citizen_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Points Used</p>
                      <p className="font-medium">{redemption.points_used}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Redemption Code</p>
                      <p className="font-mono font-medium text-primary">{redemption.redemption_code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Requested At</p>
                      <p className="font-medium">
                        {new Date(redemption.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {redemption.delivery_address && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Delivery Address</p>
                      <p className="text-sm">{redemption.delivery_address}</p>
                      {redemption.delivery_contact && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Contact: {redemption.delivery_contact}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    {redemption.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateRedemptionStatus(redemption.id, "approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateRedemptionStatus(redemption.id, "rejected")}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {redemption.status === "approved" && (
                      <Button
                        size="sm"
                        onClick={() => updateRedemptionStatus(redemption.id, "delivered")}
                      >
                        Mark Delivered
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRedemption(redemption);
                        setIsDialogOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {redemptions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No redemptions found</p>
            </div>
          )}
        </div>
      </main>
      <Footer />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redemption Details</DialogTitle>
            <DialogDescription>
              Complete information about this redemption request
            </DialogDescription>
          </DialogHeader>
          {selectedRedemption && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Redemption Code</p>
                <p className="font-mono text-lg font-bold text-primary">
                  {selectedRedemption.redemption_code}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Citizen</p>
                  <p>{selectedRedemption.citizen_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reward</p>
                  <p>{selectedRedemption.reward_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Points Used</p>
                  <p>{selectedRedemption.points_used}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p>{selectedRedemption.status}</p>
                </div>
              </div>
              {selectedRedemption.delivery_address && (
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Address</p>
                  <p>{selectedRedemption.delivery_address}</p>
                  {selectedRedemption.delivery_contact && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Contact: {selectedRedemption.delivery_contact}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRedemptions;