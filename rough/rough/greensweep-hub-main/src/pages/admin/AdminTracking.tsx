import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { MapPin, User, Clock, CheckCircle, Upload, Loader2, FileImage } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Report {
    id: number;
    reporterName: string;
    address: string;
    description: string;
    status: "pending" | "verified" | "in-progress" | "cleaned" | "rejected";
    image: string;
    assignedWorker?: string;
    createdAt: string;
}

const AdminTracking = () => {
    const { toast } = useToast();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isResolverOpen, setIsResolverOpen] = useState(false);
    const [resolveImage, setResolveImage] = useState<File | null>(null);
    const [resolveRemarks, setResolveRemarks] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://127.0.0.1:5000/api/reports", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                // Filter for active reports (not cleaned/rejected)
                const mappedReports = data.reports
                    .filter((r: any) => r.status !== "cleaned" && r.status !== "rejected")
                    .map((r: any) => ({
                        id: r.id,
                        reporterName: r.reporter_name || "Unknown",
                        address: r.address || "No address",
                        description: r.description,
                        status: r.status,
                        image: r.photo_url,
                        assignedWorker: r.assignment?.worker_name,
                        createdAt: r.created_at,
                    }));
                setReports(mappedReports);
            }
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReport || !resolveImage) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("image", resolveImage);
            formData.append("remarks", resolveRemarks);

            const response = await fetch(
                `http://127.0.0.1:5000/api/admin/reports/${selectedReport.id}/resolve`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            if (response.ok) {
                toast({
                    title: "Report Resolved",
                    description: "The report has been marked as cleaned.",
                });
                setIsResolverOpen(false);
                setReports((prev) => prev.filter((r) => r.id !== selectedReport.id));
                setResolveImage(null);
                setResolveRemarks("");
            } else {
                const data = await response.json();
                throw new Error(data.error || "Failed to resolve report");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to resolve report",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
            case "verified":
                return "bg-blue-500/10 text-blue-600 border-blue-500/20";
            case "in-progress":
                return "bg-purple-500/10 text-purple-600 border-purple-500/20";
            default:
                return "bg-gray-500/10 text-gray-600 border-gray-500/20";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-nature">
            <Navbar />
            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                            <Clock className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Tracking</h1>
                            <p className="text-muted-foreground">
                                Track active reports and update their status
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-12 bg-card rounded-2xl border border-border">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-foreground">All Caught Up!</h3>
                            <p className="text-muted-foreground">No active reports to track.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reports.map((report) => (
                                <Card key={report.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="aspect-video w-full overflow-hidden bg-muted relative">
                                        <img
                                            src={
                                                report.image.startsWith("http")
                                                    ? report.image
                                                    : `http://127.0.0.1:5000${report.image}`
                                            }
                                            alt="Report"
                                            className="w-full h-full object-cover"
                                        />
                                        <Badge
                                            className={`absolute top-2 right-2 ${getStatusBadge(report.status)}`}
                                        >
                                            {report.status}
                                        </Badge>
                                    </div>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg">Report #{report.id}</CardTitle>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <CardDescription className="line-clamp-2">
                                            {report.address}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                <span>{report.reporterName}</span>
                                            </div>
                                            {report.assignedWorker && (
                                                <div className="flex items-center gap-2 text-primary">
                                                    <User className="w-4 h-4" />
                                                    <span>Assigned: {report.assignedWorker}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Dialog open={isResolverOpen} onOpenChange={setIsResolverOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    className="w-full"
                                                    variant="hero"
                                                    onClick={() => {
                                                        setSelectedReport(report);
                                                        setIsResolverOpen(true);
                                                    }}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Mark as Cleaned
                                                </Button>
                                            </DialogTrigger>
                                            {selectedReport?.id === report.id && (
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Resolve Report #{report.id}</DialogTitle>
                                                    </DialogHeader>
                                                    <form onSubmit={handleResolveSubmit} className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="image">Upload Cleaned Image</Label>
                                                            <div className="flex items-center justify-center w-full">
                                                                <label
                                                                    htmlFor="image-upload"
                                                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                                                >
                                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                        {resolveImage ? (
                                                                            <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                                                                                <FileImage className="w-4 h-4" />
                                                                                {resolveImage.name}
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                                                                <p className="text-sm text-muted-foreground">
                                                                                    Click to upload image
                                                                                </p>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    <input
                                                                        id="image-upload"
                                                                        type="file"
                                                                        accept="image/*"
                                                                        className="hidden"
                                                                        onChange={(e) =>
                                                                            setResolveImage(e.target.files?.[0] || null)
                                                                        }
                                                                        required
                                                                    />
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="remarks">Remarks</Label>
                                                            <Textarea
                                                                id="remarks"
                                                                placeholder="Add any comments about the cleanup..."
                                                                value={resolveRemarks}
                                                                onChange={(e) => setResolveRemarks(e.target.value)}
                                                            />
                                                        </div>
                                                        <DialogFooter>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => setIsResolverOpen(false)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button type="submit" variant="hero" disabled={isSubmitting}>
                                                                {isSubmitting ? (
                                                                    <>
                                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                        Submitting...
                                                                    </>
                                                                ) : (
                                                                    "Confirm Resolution"
                                                                )}
                                                            </Button>
                                                        </DialogFooter>
                                                    </form>
                                                </DialogContent>
                                            )}
                                        </Dialog>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AdminTracking;
