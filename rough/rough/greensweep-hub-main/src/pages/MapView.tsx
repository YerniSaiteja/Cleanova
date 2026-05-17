import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GarbageMap from "@/components/GarbageMap";
import { MapPin } from "lucide-react";

const MapView = () => {
  return (
    <div className="min-h-screen bg-gradient-nature flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-8">
        <div className="container mx-auto px-4 h-full flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Garbage Report Map
                </h1>
                <p className="text-sm text-muted-foreground">
                  View all reported locations and track cleanup progress
                </p>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1 min-h-[600px] bg-card rounded-2xl shadow-card border border-border overflow-hidden">
            <GarbageMap />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MapView;
