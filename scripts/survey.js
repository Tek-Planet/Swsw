
// scripts/seed-survey.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Adjust the path if necessary

// The survey data from your app
const surveyData = [
  {
    id: 1,
    question: 'What’s your vibe for this event?',
    type: 'single',
    options: ['Chill', 'High-Energy', 'Social', 'Low-Key', 'Networking'],
  },
  {
    id: 2,
    question: 'Who do you want to meet?',
    type: 'multi',
    options: ['New friends', 'People with similar interests', 'Creatives', 'Professionals', 'Anyone fun'],
  },
  {
    id: 3,
    question: 'What are you looking forward to?',
    type: 'single',
    options: ['Dancing', 'Drinking', 'Deep conversations', 'Games', 'Exploring the venue'],
  },
];

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Add your databaseURL here if it's not in the service account file
  // databaseURL: "https://your-project-id.firebaseio.com" 
});

const db = admin.firestore();

/**
 * Seeds the survey questions for a specific event.
 * @param {string} eventId The ID of the event to add the survey to.
 */
async function seedSurveyForEvent(eventId) {
  if (!eventId) {
    console.error('Error: No event ID provided. Please run the script with an event ID.');
    console.log('Usage: node scripts/seed-survey.js <your-event-id>');
    return;
  }

  console.log(`Starting to seed survey for event: ${eventId}`);

  const surveyCollectionRef = db.collection('events').doc(eventId).collection('survey');
  const batch = db.batch();

  surveyData.forEach((question) => {
    // Use the numeric 'id' as the document ID in Firestore, converted to a string
    const questionDocRef = surveyCollectionRef.doc(question.id.toString());
    batch.set(questionDocRef, question);
  });

  try {
    await batch.commit();
    console.log('Successfully seeded survey questions!');
  } catch (error) {
    console.error('Error seeding survey questions:', error);
  }
}

// Get the event ID from the command-line arguments
const eventId = process.argv[2];
seedSurveyForEvent('YFetQljqj3pl6rR3FoZk');
