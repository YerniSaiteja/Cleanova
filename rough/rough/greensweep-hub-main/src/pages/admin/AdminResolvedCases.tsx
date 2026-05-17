import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Loader2, Calendar, User, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResolvedCase {
    id: number;
    reporterName: string;
    address: string;
    clean_image: string;
    resolution_remarks: string;
    resolved_by: string;
    updated_at: string;
    photo_url: string; // Original photo
}

const AdminResolvedCases = () => {
    const { toast } = useToast();
    const [cases, setCases] = useState<ResolvedCase[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResolvedCases();
    }, []);

    const fetchResolvedCases = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://127.0.0.1:5000/api/admin/resolved-cases", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setCases(data.resolved_cases);
            } else {
                throw new Error("Failed to fetch resolved cases");
            }
        } catch (error) {
            console.error("Failed to fetch resolved cases", error);
            toast({
                title: "Error",
                description: "Failed to load resolved cases",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="min-h-screen bg-gradient-nature">
            <Navbar />
            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Resolved Cases</h1>
                            <p className="text-muted-foreground">
                                Gallery of successfully cleaned locations
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : cases.length === 0 ? (
                        <div className="text-center py-12 bg-card rounded-2xl border border-border">
                            <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-foreground">No Resolved Cases Yet</h3>
                            <p className="text-muted-foreground">Resolved reports will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {cases.map((item) => (
                                <Card key={item.id} className="overflow-hidden bg-card border-border hover:shadow-lg transition-all">
                                    <div className="grid grid-cols-2 gap-1 h-64">
                                        <div className="relative h-full">
                                            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                                Before
                                            </div>
                                            <img
                                                src={
                                                    item.photo_url.startsWith("http")
                                                        ? item.photo_url
                                                        : `http://127.0.0.1:5000${item.photo_url}`
                                                }
                                                alt="Before"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="relative h-full">
                                            <div className="absolute top-2 left-2 bg-green-600/80 text-white text-xs px-2 py-1 rounded">
                                                After
                                            </div>
                                            <img
                                                src={item.clean_image || "/placeholder.svg"}
                                                alt="After"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg">Case #{item.id}</CardTitle>
                                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                                                Resolved
                                            </Badge>
                                        </div>
                                        <CardDescription>{item.address}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex items-center justify-between text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    <span>Reporter: {item.reporterName}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{formatDate(item.updated_at)}</span>
                                                </div>
                                            </div>
                                            <div className="pt-3 border-t border-border">
                                                <div className="flex items-center gap-2 mb-1 text-primary font-medium">
                                                    <UserCheck className="w-4 h-4" />
                                                    <span>Resolved by: {item.resolved_by}</span>
                                                </div>
                                                <p className="text-muted-foreground italic">
                                                    "{item.resolution_remarks || "No remarks"}"
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
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

export default AdminResolvedCases;
