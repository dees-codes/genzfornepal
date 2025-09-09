import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Hospital, Droplets, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <div className="max-w-md mx-auto">
        {/* Hero Section */}
        <div className="text-center py-12 px-4">
          <div className="mb-6">
            <Heart className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Emergency Health
            </h1>
            <p className="text-muted-foreground">
              Find hospitals and blood donors instantly during emergencies
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="px-4 space-y-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <Hospital className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold">Hospital Finder</h3>
                <p className="text-sm text-muted-foreground">
                  Locate nearby hospitals with real-time availability
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <Droplets className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="font-semibold">Blood Requests</h3>
                <p className="text-sm text-muted-foreground">
                  Find urgent blood requests and connect with donors
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <Shield className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-semibold">Verified Information</h3>
                <p className="text-sm text-muted-foreground">
                  Admin-verified and up-to-date medical information
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="px-4 pb-8">
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-4 text-lg font-semibold min-h-[56px]"
            data-testid="button-login"
          >
            Get Started - Login to Continue
          </Button>
          
          <p className="text-center text-xs text-muted-foreground mt-4">
            Secure authentication powered by Replit
          </p>
        </div>

        {/* Emergency Contact */}
        <div className="fixed bottom-4 right-4">
          <Button
            onClick={() => {
              if (confirm('Call emergency services (999)?')) {
                window.location.href = 'tel:999';
              }
            }}
            className="w-14 h-14 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 flex items-center justify-center"
            data-testid="button-emergency"
          >
            📞
          </Button>
        </div>
      </div>
    </div>
  );
}
