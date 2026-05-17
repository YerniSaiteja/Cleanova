import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Camera, MapPin, Upload, X, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import exifr from "exifr";

const Report = () => {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number, address?: string } | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);

      // Extract GPS data from EXIF
      try {
        const gps = await exifr.gps(selectedFile);
        if (gps && gps.latitude && gps.longitude) {
          const lat = gps.latitude;
          const lng = gps.longitude;

          toast({
            title: "GPS data found!",
            description: "Location extracted from image.",
          });

          // Fetch address
          const address = await fetchAddress(lat, lng);
          setLocation({ lat, lng, address });

        } else {
          setLocation(null);
          toast({
            title: "No GPS data",
            description: "No GPS metadata found in this image. Please ensure Location services were on when taking the photo.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error reading EXIF:", error);
        setLocation(null);
        toast({
          title: "Error reading image",
          description: "Could not read image metadata.",
          variant: "destructive",
        });
      }
    }
  };

  const fetchAddress = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      return data.display_name || "Address not found";
    } catch (error) {
      console.error("Error fetching address:", error);
      return "Address could not be fetched";
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const address = await fetchAddress(lat, lng);

          setLocation({
            lat,
            lng,
            address
          });
          toast({
            title: "Location captured!",
            description: "GPS coordinates have been recorded.",
          });
        },
        () => {
          toast({
            title: "Location error",
            description: "Unable to get your location. Please enable GPS.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !location) {
      toast({
        title: "Missing information",
        description: "Please upload a GPS-located image or capture your location manually.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('location_latitude', location.lat.toString());
      formData.append('location_longitude', location.lng.toString());
      if (location.address) formData.append('location_address', location.address);
      if (description) formData.append('description', description);

      const token = localStorage.getItem('token'); // Assuming token is stored here
      if (!token) {
        throw new Error("You must be logged in to submit a report.");
      }

      const response = await fetch('http://127.0.0.1:5000/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit report");
      }

      setIsSuccess(true);
      toast({
        title: "Report submitted!",
        description: "You've earned eco-points. Thank you for your contribution!",
      });

    } catch (error) {
      console.error(error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-nature">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-hero flex items-center justify-center mx-auto mb-6 animate-fade-in-up">
                <CheckCircle className="w-12 h-12 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-4 animate-fade-in-up animation-delay-200">
                Report Submitted Successfully!
              </h1>
              <p className="text-muted-foreground mb-6 animate-fade-in-up animation-delay-400">
                Thank you for helping keep our city clean. Your report is being verified
                and you've earned <span className="text-secondary font-bold">50 eco-points</span>!
              </p>
              <div className="flex gap-4 justify-center animate-fade-in-up animation-delay-600">
                <Button variant="hero" onClick={() => {
                  setIsSuccess(false);
                  setImage(null);
                  setFile(null);
                  setLocation(null);
                  setDescription("");
                }}>
                  Submit Another Report
                </Button>
                <Button variant="outline" asChild>
                  <a href="/dashboard">View Dashboard</a>
                </Button>
              </div>
            </div>
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
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
                Report Garbage
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Spotted Uncollected Waste?
              </h1>
              <p className="text-muted-foreground">
                Help us keep our city clean by reporting garbage. Earn eco-points for every verified report!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Upload Photo *
                </label>

                {image ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={image}
                      alt="Uploaded garbage"
                      className="w-full h-64 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
                  >
                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-foreground font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Location */}
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Location *
                </label>

                {location ? (
                  <div className="flex items-center gap-3 p-4 bg-accent rounded-xl">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {location.address || "GPS data extracted"}
                      </p>
                      <p className="text-xs text-muted-foreground min-w-[300px]">
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-xl">
                      <p className="text-sm text-muted-foreground">
                        Location will be automatically extracted from the uploaded image's GPS data.
                      </p>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getLocation}
                      className="w-full"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Capture Current Location Instead
                    </Button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any additional details about the garbage..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Submit Report & Earn Points
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Report;
