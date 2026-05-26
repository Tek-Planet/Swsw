
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Camera, CameraOff, CheckCircle, XCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface TicketResult {
  status: 'valid' | 'invalid' | 'used' | 'not_found';
  order?: any;
  attendee?: any;
  message: string;
}

const Scanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<TicketResult | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    if (!containerRef.current) return;

    try {
      scannerRef.current = new Html5Qrcode('qr-reader');
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopScanner();
          await validateTicket(decodedText);
        },
        () => {} // Ignore errors during scanning
      );
      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      toast.error('Failed to access camera. Please check permissions.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setIsScanning(false);
  };

  const validateTicket = async (qrValue: string) => {
    setIsValidating(true);
    setResult(null);

    try {
      const qrParts = qrValue.trim().split('-');
      if (qrParts.length < 2) {
        setResult({ status: 'not_found', message: 'Invalid QR code format.' });
        return;
      }
      
      const orderId = qrParts.slice(0, -1).join('-');
      const attendeeIndex = parseInt(qrParts[qrParts.length - 1], 10);

      if (!orderId || isNaN(attendeeIndex)) {
        setResult({ status: 'not_found', message: 'Invalid QR code data.' });
        return;
      }

      const orderRef = doc(db, 'orders', orderId);
      const orderSnapshot = await getDoc(orderRef);

      if (!orderSnapshot.exists()) {
        setResult({ status: 'not_found', message: 'Order not found.' });
        return;
      }

      const orderData = orderSnapshot.data();

      if (orderData.status !== 'paid') {
        setResult({ status: 'invalid', order: { ...orderData, id: orderId }, message: `Order status: ${orderData.status}.` });
        return;
      }

      const attendee = orderData.attendees[attendeeIndex];

      if (!attendee) {
        setResult({ status: 'not_found', message: 'Attendee not found in this order.' });
        return;
      }

      if (attendee.checkedIn) {
        setResult({ 
          status: 'used', 
          order: { ...orderData, id: orderId }, 
          attendee,
          message: `Already checked in on ${attendee.checkedInAt?.toDate?.().toLocaleString()}.` 
        });
        return;
      }

      // Create a new attendees array with the updated attendee
      const updatedAttendees = [...orderData.attendees];
      updatedAttendees[attendeeIndex] = {
        ...attendee,
        checkedIn: true,
        checkedInAt: new Date(), // Using client-side timestamp for immediate feedback
      };

      await updateDoc(orderRef, {
        attendees: updatedAttendees,
      });

      const finalOrderData = { ...orderData, attendees: updatedAttendees, id: orderId };
      setResult({ 
        status: 'valid', 
        order: finalOrderData, 
        attendee, 
        message: 'Check-in successful!' 
      });
      toast.success('Ticket validated successfully!');

    } catch (error) {
      console.error('Validation error:', error);
      setResult({ status: 'not_found', message: 'Error validating ticket.' });
    } finally {
      setIsValidating(false);
    }
  };

  const resetScanner = () => setResult(null);

  const getResultIcon = () => {
    switch (result?.status) {
      case 'valid': return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'used': return <AlertCircle className="w-16 h-16 text-yellow-500" />;
      case 'invalid':
      case 'not_found': return <XCircle className="w-16 h-16 text-destructive" />;
      default: return null;
    }
  };

  const getResultColor = () => {
    switch (result?.status) {
      case 'valid': return 'border-green-500 bg-green-500/10';
      case 'used': return 'border-yellow-500 bg-yellow-500/10';
      case 'invalid':
      case 'not_found': return 'border-destructive bg-destructive/10';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Ticket Scanner</h1>
        <p className="text-muted-foreground mt-1">Scan QR codes to validate tickets.</p>
      </div>

      <Card className="bg-card border-border max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground"><Camera className="w-5 h-5" />Camera Scanner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div id="qr-reader" ref={containerRef} className="w-full aspect-square bg-muted rounded-lg overflow-hidden" />
          <Button onClick={isScanning ? stopScanner : startScanner} variant={isScanning ? 'destructive' : 'default'} className="w-full">
            {isScanning ? <><CameraOff className="w-4 h-4 mr-2" />Stop Scanner</> : <><Camera className="w-4 h-4 mr-2" />Start Scanner</>}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className={`border-2 ${getResultColor()}`}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {getResultIcon()}
              <div>
                <h3 className="text-xl font-bold text-foreground capitalize">
                  {result.status.replace('_', ' ')}
                </h3>
                <p className="text-muted-foreground mt-1">{result.message}</p>
              </div>

              {result.order && (
                <div className="w-full max-w-md space-y-2 text-left bg-background/50 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="font-mono text-foreground">{result.order.id?.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="text-foreground">
                      {result.attendee ? result.attendee.name : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Event:</span>
                    <span className="text-foreground">{result.order.eventTitle || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ticket Type:</span>
                    <span className="text-foreground">
                      {result.order.items?.map((i: any) => `${i.tierName} x${i.quantity}`).join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold text-foreground">₹{result.order.subtotal}</span>
                  </div>
                </div>
              )}

              <Button onClick={resetScanner} variant="outline" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Scan Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Scanner;
