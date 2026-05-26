import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AttendeeInfo } from "@/types";

interface DonorInfoFormProps {
  donor: AttendeeInfo;
  onChange: (field: keyof AttendeeInfo, value: string) => void;
  onUseAttendeeDetailsChange: (checked: boolean) => void;
  useAttendeeDetails: boolean;
  isBooker: boolean;
  showError: boolean;
}

const DonorInfoForm = ({ 
  donor, 
  onChange, 
  onUseAttendeeDetailsChange, 
  useAttendeeDetails,
  isBooker,
  showError
}: DonorInfoFormProps) => {
  return (
    <div className="space-y-4 p-4 border border-border rounded-lg">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Donor Details</Label>
        {isBooker && (
            <div className="flex items-center space-x-2">
                <Checkbox 
                    id="useAttendeeDetails"
                    checked={useAttendeeDetails}
                    onCheckedChange={onUseAttendeeDetailsChange}
                />
                <Label htmlFor="useAttendeeDetails" className="text-sm font-medium leading-none">Same as Attendee 1</Label>
            </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="donorName">Full Name *</Label>
          <Input 
            id="donorName" 
            value={donor.name}
            onChange={(e) => onChange('name', e.target.value)}
            className={showError && !donor.name.trim() ? 'border-destructive' : ''}
            disabled={useAttendeeDetails}
          />
        </div>
        <div>
          <Label htmlFor="donorEmail">Email *</Label>
          <Input 
            id="donorEmail" 
            type="email" 
            value={donor.email}
            onChange={(e) => onChange('email', e.target.value)}
            className={showError && !donor.email.trim() ? 'border-destructive' : ''}
            disabled={useAttendeeDetails}
          />
        </div>
        <div>
            <Label htmlFor="donorPhone">Phone Number *</Label>
            <Input 
                id="donorPhone" 
                type="tel" 
                value={donor.phone}
                onChange={(e) => onChange('phone', e.target.value)}
                className={showError && !donor.phone.trim() ? 'border-destructive' : ''}
                disabled={useAttendeeDetails}
            />
        </div>
      </div>
    </div>
  );
};

export default DonorInfoForm;