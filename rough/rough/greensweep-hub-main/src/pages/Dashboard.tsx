import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Award, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: number;
  location: string;
  date: string;
  status: "verified" | "pending" | "in-progress" | "resolved" | "cleaned" | "rejected";
  points: number;
  clean_image?: string;
}

const Dashboard = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('http://127.0.0.1:5000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.user.profile) {
              setTotalPoints(data.user.profile.total_eco_points || 0);
            }
          }
        } catch (e) {
          console.error("Failed to fetch user data", e);
        }
      }
      
      // Fallback if fetch fails
      if (!user) {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          if (parsedUser.profile) {
            setTotalPoints(parsedUser.profile.total_eco_points || 0);
          }
        }
      }
    };

    fetchUserData();
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://127.0.0.1:5000/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Backend returns "reports" array
        // We need to map it to our interface
        const mappedReports = data.reports.map((r: any) => ({
          id: r.id,
          location: r.address || `${r.location_latitude.toFixed(4)}, ${r.location_longitude.toFixed(4)}`, // Use address or coords
          date: new Date(r.created_at).toLocaleDateString(),
          status: r.status,
          points: r.status === 'cleaned' ? 70 : (r.status === 'verified' ? 20 : 0),
          clean_image: r.clean_image
        }));
        setReports(mappedReports);
      }
    } catch (error) {
      console.error("Failed to fetch reports", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-nature">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Welcome back, {user?.full_name || 'Eco Warrior'}! 🌱
            </h1>
            <p className="text-muted-foreground">
              Track your contributions and see the impact you're making.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-points flex items-center justify-center">
                  <Award className="w-6 h-6 text-secondary-foreground" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-1">{totalPoints}</h3>
              <p className="text-sm text-muted-foreground">Eco-Points Earned</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4 mb-10">
            <Button variant="hero" asChild>
              <Link to="/report">Report Garbage</Link>
            </Button>
            <Button variant="points" asChild>
              <Link to="/rewards">Redeem Points</Link>
            </Button>
          </div>

          {/* Recent Reports */}
          <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Recent Reports</h2>
            </div>

            <div className="divide-y divide-border">
              {reports.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <p className="mb-4">No reports yet.</p>
                  <Button variant="outline" asChild>
                    <Link to="/report">Make your first report</Link>
                  </Button>
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 w-full">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${report.status === "verified" || report.status === "resolved" || report.status === "cleaned"
                        ? "bg-accent text-primary"
                        : "bg-secondary/20 text-secondary"
                        }`}>
                        {(report.status === "verified" || report.status === "resolved" || report.status === "cleaned") ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{report.location}</p>
                        <p className="text-sm text-muted-foreground">{report.date}</p>
                      </div>
                    </div>

                    {report.clean_image && (
                      <div className="mt-4 sm:mt-0 w-full sm:w-auto flex flex-col items-center gap-2">
                        <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Resolved Image</span>
                        <img 
                          src={report.clean_image.startsWith('http') ? report.clean_image : `http://127.0.0.1:5000${report.clean_image}`} 
                          alt="Resolved Clean" 
                          className="w-full sm:w-24 h-32 sm:h-20 object-cover rounded-lg border-2 border-green-500/30 shadow-sm transition-transform hover:scale-105 cursor-pointer" 
                          onClick={() => window.open(report.clean_image?.startsWith('http') ? report.clean_image : `http://127.0.0.1:5000${report.clean_image}`, '_blank')}
                        />
                      </div>
                    )}

                    <div className="text-right shrink-0 w-full sm:w-auto mt-4 sm:mt-0 flex justify-between sm:block items-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${report.status === "verified" || report.status === "resolved" || report.status === "cleaned"
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary/20 text-secondary-foreground"
                        }`}>
                        {report.status}
                      </span>
                      {report.points > 0 && (
                        <p className="text-sm font-bold text-secondary mt-0 sm:mt-1">+{report.points} pts</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
