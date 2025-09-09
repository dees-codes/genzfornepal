import { Phone, MessageCircle, Copy, Share2, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { BloodRequest } from "@shared/schema";

interface BloodRequestCardProps {
  request: BloodRequest;
  onCall: (phone: string) => void;
  onWhatsApp: (phone: string) => void;
}

export function BloodRequestCard({ request, onCall, onWhatsApp }: BloodRequestCardProps) {
  const { toast } = useToast();

  const getUrgencyBadge = () => {
    switch (request.urgency) {
      case 'critical':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 text-xs">
            <span className="mr-1">⚠️</span>
            Critical
          </Badge>
        );
      case 'urgent':
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Urgent
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Normal
          </Badge>
        );
    }
  };

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(request.contactPhone);
      toast({
        title: "Number copied",
        description: "Contact number copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy number to clipboard",
        variant: "destructive",
      });
    }
  };

  const shareRequest = async () => {
    const shareData = {
      title: `Blood Request - ${request.bloodGroup}`,
      text: `Urgent blood request for ${request.bloodGroup} at ${request.hospitalName}. Contact: ${request.contactPerson} - ${request.contactPhone}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
        toast({
          title: "Request details copied",
          description: "Blood request details copied to clipboard",
        });
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Could not share request details",
        variant: "destructive",
      });
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInHours >= 24) {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffInHours >= 1) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="border-b border-border bg-white" data-testid={`blood-request-card-${request.id}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              <span data-testid={`blood-group-${request.id}`}>{request.bloodGroup}</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground" data-testid={`patient-name-${request.id}`}>
                {request.patientName || 'Emergency Patient'}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid={`hospital-name-${request.id}`}>
                {request.hospitalName}
              </p>
            </div>
          </div>
          {getUrgencyBadge()}
        </div>
        
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Units Required:</span>
            <span className="font-medium" data-testid={`units-required-${request.id}`}>
              {request.unitsRequired} bag{request.unitsRequired > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contact Person:</span>
            <span className="font-medium" data-testid={`contact-person-${request.id}`}>
              {request.contactPerson}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location:</span>
            <span className="font-medium" data-testid={`location-${request.id}`}>
              {request.district}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Posted:</span>
            <span className="text-xs text-muted-foreground" data-testid={`time-ago-${request.id}`}>
              {formatTimeAgo(new Date(request.createdAt!))}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Button 
            onClick={() => onCall(request.contactPhone)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 px-4 rounded-lg font-medium text-sm min-h-[44px] flex items-center justify-center"
            data-testid={`button-call-${request.id}`}
          >
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
          <Button 
            onClick={() => onWhatsApp(request.contactPhone)}
            className="bg-green-600 text-white hover:bg-green-700 py-2.5 px-4 rounded-lg font-medium text-sm min-h-[44px] flex items-center justify-center"
            data-testid={`button-whatsapp-${request.id}`}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={copyNumber}
            variant="secondary"
            className="bg-gray-600 text-white hover:bg-gray-700 py-2.5 px-4 rounded-lg font-medium text-sm min-h-[44px] flex items-center justify-center"
            data-testid={`button-copy-${request.id}`}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Number
          </Button>
          <Button 
            onClick={shareRequest}
            variant="secondary"
            className="bg-blue-600 text-white hover:bg-blue-700 py-2.5 px-4 rounded-lg font-medium text-sm min-h-[44px] flex items-center justify-center"
            data-testid={`button-share-${request.id}`}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
