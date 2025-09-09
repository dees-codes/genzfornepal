import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Hospital, Droplets, Shield, Anchor } from "lucide-react";
import jollyRogerImg from "@assets/image_1757377928357.png";
import nepalFlagImg from "@assets/nepal_1757377953102.png";

export default function Landing() {
  return (
    <div className="min-h-screen nepal-gradient">
      <div className="max-w-md mx-auto">
        {/* Hero Section */}
        <div className="text-center py-8 px-4 relative">
          {/* Nepal Flag */}
          <div className="absolute top-4 right-4 w-12 h-10">
            <img 
              src={nepalFlagImg} 
              alt="Nepal Flag" 
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="mb-6 bounce-in">
            {/* One Piece Jolly Roger */}
            <div className="w-20 h-20 mx-auto mb-4 straw-hat-border bg-white p-2 jolly-roger">
              <img 
                src={jollyRogerImg} 
                alt="Straw Hat Pirates Flag" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
              🏴‍☠️ Medical Adventure Crew
            </h1>
            <p className="text-white/90 drop-shadow">
              Navigate the Grand Line of Hospitals & Blood Banks in Nepal! 🇳🇵
            </p>
          </div>
        </div>

        {/* Adventure Features */}
        <div className="px-4 space-y-4 mb-8">
          <Card className="adventure-card border-0">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full nepal-blue flex items-center justify-center">
                <Hospital className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">⚓ Hospital Navigator</h3>
                <p className="text-sm text-gray-600">
                  Chart your course to Nepal's finest medical ports
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="adventure-card border-0">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full nepal-red flex items-center justify-center">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">🩸 Blood Treasure Hunt</h3>
                <p className="text-sm text-gray-600">
                  Join the crew's mission to save lives across Nepal
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="adventure-card border-0">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">🏴‍☠️ Verified Crew Intel</h3>
                <p className="text-sm text-gray-600">
                  Trustworthy information verified by our medical crew
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="px-4 pb-8">
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="w-full bg-white text-primary hover:bg-gray-50 py-4 text-lg font-bold min-h-[56px] shadow-lg border-4 border-yellow-400"
            data-testid="button-login"
          >
            ⚓ Join the Medical Crew! 🏴‍☠️
          </Button>
          
          <p className="text-center text-xs text-white/80 mt-4 drop-shadow">
            Set sail on your medical adventure across Nepal!
          </p>
        </div>

        {/* Emergency Contact */}
        <div className="fixed bottom-4 right-4">
          <Button
            onClick={() => {
              if (confirm('Call Nepal emergency services (102/103/108)?')) {
                window.location.href = 'tel:102';
              }
            }}
            className="w-14 h-14 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 flex items-center justify-center fab-emergency straw-hat-border border-yellow-400"
            data-testid="button-emergency"
          >
            🚨
          </Button>
        </div>
      </div>
    </div>
  );
}
