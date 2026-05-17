import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Eye,
  User,
  Calendar,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: number;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  location: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  image: string;
  status: "pending" | "verified" | "in-progress" | "resolved" | "rejected";
  date: string;
  assignedWorker?: string;
  resolvedDate?: string;
}

const mockReports: Report[] = [
  {
    id: 1,
    reporterName: "Aditi Sharma",
    reporterEmail: "aditi.sharma@example.com",
    reporterPhone: "+91 98765 43210",
    location: "MG Road, Bengaluru",
    address: "Near Metro Station, MG Road, Bengaluru - 560001",
    lat: 12.9716,
    lng: 77.5946,
    description: "Large pile of garbage near metro station entrance",
    image: "https://via.placeholder.com/300x200",
    status: "pending",
    date: "2024-01-15T10:30:00",
  },
  {
    id: 2,
    reporterName: "Raj Kumar",
    reporterEmail: "raj.kumar@example.com",
    reporterPhone: "+91 98765 43211",
    location: "Indiranagar, Bengaluru",
    address: "100 Feet Road, Indiranagar, Bengaluru - 560038",
    lat: 12.9784,
    lng: 77.6408,
    description: "Uncollected waste bins overflowing",
    image: "https://via.placeholder.com/300x200",
    status: "verified",
    date: "2024-01-14T14:20:00",
  },
  {
    id: 3,
    reporterName: "Priya Menon",
    reporterEmail: "priya.menon@example.com",
    reporterPhone: "+91 98765 43212",
    location: "Koramangala, Bengaluru",
    address: "5th Block, Koramangala, Bengaluru - 560095",
    lat: 12.9352,
    lng: 77.6245,
    description: "Garbage dumped on roadside",
    image: "https://via.placeholder.com/300x200",
    status: "in-progress",
    date: "2024-01-13T09:15:00",
    assignedWorker: "Worker-001",
  },
  {
    id: 4,
    reporterName: "Vikram Singh",
    reporterEmail: "vikram.singh@example.com",
    reporterPhone: "+91 98765 43213",
    location: "Whitefield, Bengaluru",
    address: "ITPL Road, Whitefield, Bengaluru - 560066",
    lat: 12.9698,
    lng: 77.7499,
    description: "Construction waste blocking pathway",
    image: "https://via.placeholder.com/300x200",
    status: "resolved",
    date: "2024-01-12T11:45:00",
    assignedWorker: "Worker-002",
    resolvedDate: "2024-01-12T16:30:00",
  },
  {
    id: 5,
    reporterName: "Sneha Patel",
    reporterEmail: "sneha.patel@example.com",
    reporterPhone: "+91 98765 43214",
    location: "HSR Layout, Bengaluru",
    address: "27th Main, HSR Layout, Bengaluru - 560102",
    lat: 12.9141,
    lng: 77.6411,
    description: "Plastic waste accumulation",
    image: "https://via.placeholder.com/300x200",
    status: "rejected",
    date: "2024-01-11T08:20:00",
  },
];

const AdminReports = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:5000/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Map backend data to frontend interface
        const mappedReports: Report[] = data.reports.map((r: any) => ({
          id: r.id,
          reporterName: r.reporter_name || "Unknown",
          reporterEmail: "N/A", // Backend doesn't send this yet
          reporterPhone: "N/A",
          location: r.address ? r.address.split(',')[0] : "Unknown Location",
          address: r.address || "No address",
          lat: r.location_latitude,
          lng: r.location_longitude,
          description: r.description || "",
          image: r.photo_url.startsWith('http') ? r.photo_url : `http://127.0.0.1:5000${r.photo_url}`,
          status: r.status,
          date: r.created_at,
          assignedWorker: r.assignment?.worker_name,
        }));
        setReports(mappedReports);
      }
    } catch (error) {
      console.error("Failed to fetch reports", error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive"
      });
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (reportId: number, newStatus: Report["status"]) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:5000/api/reports/${reportId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setReports((prev) =>
          prev.map((report) =>
            report.id === reportId
              ? { ...report, status: newStatus, ...(newStatus === "resolved" && !report.resolvedDate ? { resolvedDate: new Date().toISOString() } : {}) }
              : report
          )
        );
        toast({
          title: "Status updated",
          description: `Report #${reportId} status changed to ${newStatus}`,
        });

        if (newStatus === 'verified') {
          toast({
            title: "Points Awarded",
            description: "User has been awarded 20 eco-points.",
            variant: "default"
          });
        }
      } else {
        const data = await response.json();
        toast({ title: "Error", description: data.error || "Failed to update status", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" });
    }
  };

  const handleAssignWorker = (reportId: number, workerId: string) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === reportId
          ? { ...report, status: "in-progress" as const, assignedWorker: workerId }
          : report
      )
    );
    toast({
      title: "Worker assigned",
      description: `Report #${reportId} assigned to ${workerId}`,
    });
  };

  const getStatusBadge = (status: Report["status"]) => {
    const variants = {
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      verified: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      "in-progress": "bg-purple-500/10 text-purple-600 border-purple-500/20",
      resolved: "bg-green-500/10 text-green-600 border-green-500/20",
      rejected: "bg-red-500/10 text-red-600 border-red-500/20",
    };
    return variants[status];
  };

  const getStatusIcon = (status: Report["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "verified":
        return <CheckCircle className="w-4 h-4" />;
      case "in-progress":
        return <Clock className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusCounts = {
    all: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    verified: reports.filter((r) => r.status === "verified").length,
    "in-progress": reports.filter((r) => r.status === "in-progress").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    rejected: reports.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-gradient-nature">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">User Reports</h1>
                <p className="text-muted-foreground">Manage and review all user-submitted reports</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="text-2xl font-bold text-foreground">{statusCounts.all}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="text-2xl font-bold text-blue-600">{statusCounts.verified}</div>
              <div className="text-xs text-muted-foreground">Verified</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="text-2xl font-bold text-purple-600">{statusCounts["in-progress"]}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="text-2xl font-bold text-green-600">{statusCounts.resolved}</div>
              <div className="text-xs text-muted-foreground">Resolved</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
              <div className="text-xs text-muted-foreground">Rejected</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-card mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, location, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No reports found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">#{report.id}</TableCell>
                        <TableCell>
                          <img
                            src={report.image}
                            alt="Evidence"
                            className="w-12 h-12 rounded-lg object-cover border border-border cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => setSelectedReport(report)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{report.reporterName}</div>
                            <div className="text-xs text-muted-foreground">{report.reporterEmail}</div>
                            <div className="text-xs text-muted-foreground">{report.reporterPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <div className="font-medium">{report.location}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">{report.address}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {formatDate(report.date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusBadge(report.status)} flex items-center gap-1 w-fit`}>
                            {getStatusIcon(report.status)}
                            <span className="capitalize">{report.status.replace("-", " ")}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {report.assignedWorker ? (
                            <Badge variant="outline">{report.assignedWorker}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedReport(report)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {report.status === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(report.id, "verified")}
                                >
                                  Verify
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(report.id, "rejected")}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {report.status === "verified" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAssignWorker(report.id, `Worker-${String(report.id).padStart(3, "0")}`)}
                              >
                                Assign
                              </Button>
                            )}
                            {report.status === "in-progress" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(report.id, "resolved")}
                              >
                                Mark Resolved
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Report Detail Modal */}
          {selectedReport && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReport(null)}>
              <div className="bg-card rounded-2xl border border-border shadow-card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">Report Details #{selectedReport.id}</h2>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>
                      <XCircle className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Reporter Information
                    </h3>
                    <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                      <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedReport.reporterName}</span></div>
                      <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedReport.reporterEmail}</span></div>
                      <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{selectedReport.reporterPhone}</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </h3>
                    <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                      <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{selectedReport.address}</span></div>
                      <div><span className="text-muted-foreground">Coordinates:</span> <span className="font-medium">{selectedReport.lat.toFixed(6)}, {selectedReport.lng.toFixed(6)}</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Description</h3>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-foreground">{selectedReport.description}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Report Image</h3>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <img src={selectedReport.image} alt="Report" className="w-full rounded-lg" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-4 border-t border-border">
                    <div>
                      <span className="text-muted-foreground text-sm">Status:</span>
                      <Badge className={`${getStatusBadge(selectedReport.status)} ml-2`}>
                        {getStatusIcon(selectedReport.status)}
                        <span className="capitalize ml-1">{selectedReport.status.replace("-", " ")}</span>
                      </Badge>
                    </div>
                    {selectedReport.assignedWorker && (
                      <div>
                        <span className="text-muted-foreground text-sm">Assigned to:</span>
                        <Badge variant="outline" className="ml-2">{selectedReport.assignedWorker}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminReports;
