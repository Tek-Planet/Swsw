import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

export interface AttendeeInfo {
  name: string;
  email: string;
  phone: string;
}

interface AttendeeInfoFormProps {
  index: number;
  attendee: AttendeeInfo;
  onChange: (index: number, field: keyof AttendeeInfo, value: string) => void;
  isBooker?: boolean;
  showError?: boolean;
}

const AttendeeInfoForm = ({ index, attendee, onChange, isBooker, showError }: AttendeeInfoFormProps) => {
  const nameError = showError && !attendee.name.trim();
  const emailError = showError && (!attendee.email.trim() || !attendee.email.includes('@'));
  const phoneError = showError && (!attendee.phone.trim() || attendee.phone.length < 10);
  
  return (
    <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <User className="w-4 h-4 text-primary" />
        <span>
          {isBooker ? "Your Details (Attendee 1)" : `Attendee ${index + 1}`}
        </span>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`name-${index}`} className="text-xs text-muted-foreground">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`name-${index}`}
            placeholder="John Doe"
            value={attendee.name}
            onChange={(e) => onChange(index, "name", e.target.value)}
            className={`bg-background ${nameError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            required
          />
          {nameError && (
            <p className="text-xs text-destructive">Name is required</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`email-${index}`} className="text-xs text-muted-foreground">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`email-${index}`}
            type="email"
            placeholder="john@example.com"
            value={attendee.email}
            onChange={(e) => onChange(index, "email", e.target.value)}
            className={`bg-background ${emailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            required
          />
          {emailError && (
            <p className="text-xs text-destructive">Valid email is required</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`phone-${index}`} className="text-xs text-muted-foreground">
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`phone-${index}`}
            type="tel"
            placeholder="+91 98765 43210"
            value={attendee.phone}
            onChange={(e) => onChange(index, "phone", e.target.value)}
            className={`bg-background ${phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            required
          />
          {phoneError && (
            <p className="text-xs text-destructive">Valid phone number is required</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendeeInfoForm;
