
import admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin/app';
// Use 'import type' for type-only imports to resolve the error
import type { FirestoreTicketTier, TicketTierType } from '../types/event';
import serviceAccount from './serviceAccountKey.json';

// Initialize Firebase Admin SDK with the service account credentials cast to the correct type
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount)
});

const db = admin.firestore();

const eventId = 'ggcjUg5IBYAIMaP7UNae';

// The type annotations now correctly use the imported types
const ticketTiers: Omit<FirestoreTicketTier, 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Solo female entry',
    price: 2000,
    currency: 'INR',
    type: 'ticket' as TicketTierType,
    isActive: true,
    quantitySold: 0,
    sortOrder: 1,
  },
  {
    name: 'Stag entry',
    price: 5000,
    currency: 'INR',
    type: 'ticket' as TicketTierType,
    isActive: true,
    quantitySold: 0,
    sortOrder: 2,
  },
  {
    name: 'Couple entry',
    price: 4000,
    currency: 'INR',
    type: 'ticket' as TicketTierType,
    isActive: true,
    quantitySold: 0,
    sortOrder: 3,
  },
  {
    name: 'Table deposits (fully spendable)',
    price: 10000,
    currency: 'INR',
    type: 'table' as TicketTierType,
    isActive: true,
    quantitySold: 0,
    sortOrder: 4,
  },
  {
    name: 'Event photos access',
    price: 500,
    currency: 'INR',
    type: 'addon' as TicketTierType,
    isActive: true,
    quantitySold: 0,
    sortOrder: 5,
  },
];

const addTicketTiers = async () => {
  console.log(`Starting to add ticket tiers to event: ${eventId}`);
  const ticketTiersCollection = db.collection('events').doc(eventId).collection('ticketTiers');
  const batch = db.batch();

  for (const tier of ticketTiers) {
    const newTierRef = ticketTiersCollection.doc(); // Auto-generate ID
    batch.set(newTierRef, {
      ...tier,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(`✅ Successfully added ${ticketTiers.length} ticket tiers to event ${eventId}.`);
};

addTicketTiers().catch(error => {
  console.error('❌ Error adding ticket tiers: ', error);
  process.exit(1);
});
