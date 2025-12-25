

import * as functions from "firebase-functions/v1";

import { admin, db } from "./lib/firebase";

// Define types for clarity
interface SurveyAnswer {
  questionId: string;
  answer: string | string[]; // Can be a single answer or multiple answers
}

interface UserSurveyData {
  userId: string;
  interests: string[];
  answers: SurveyAnswer[];
}

/**
 * Calculates the compatibility score between two users based on shared interests and survey answers.
 * @param userA The current user's data.
 * @param userB The potential match's data.
 * @returns A numerical compatibility score.
 */
function calculateCompatibility(userA: UserSurveyData, userB: UserSurveyData): number {
  // 1. Interest Score (Weight: 40%)
  // Find interests that both users share.
  const commonInterests = userA.interests.filter(interest => userB.interests.includes(interest));
  const interestScore = commonInterests.length * 10; // Award 10 points for each common interest.

  // 2. Survey Score (Weight: 60%)
  let surveyScore = 0;
  userA.answers.forEach(answerA => {
    // Find the corresponding answer from the other user.
    const answerB = userB.answers.find(ans => ans.questionId === answerA.questionId);
    if (!answerB) return; // Skip if the other user hasn't answered this question.

    // Handle multiple-choice questions
    if (Array.isArray(answerA.answer) && Array.isArray(answerB.answer)) {
      const commonAnswers = answerA.answer.filter(ans => (answerB.answer as string[]).includes(ans));
      surveyScore += commonAnswers.length * 10; // 10 points for each shared answer option.
    } 
    // Handle single-choice questions
    else if (answerA.answer === answerB.answer) {
      surveyScore += 15; // 15 points for an exact match.
    }
  });

  // 3. Final Weighted Score
  const compatibilityScore = (interestScore * 0.4) + (surveyScore * 0.6);
  return compatibilityScore;
}


/**
 * [NEW] Cloud Function to process survey answers, find matches, and save the resulting grid.
 * This is an onCall function, triggered by the app after a user completes a survey.
 */
export const processSurveyAndFindMatches = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to submit a survey.");
    }
    const userId = context.auth.uid;
    const { eventId, answers } = data as { eventId: string, answers: SurveyAnswer[] };

    if (!eventId || !answers || !Array.isArray(answers)) {
        throw new functions.https.HttpsError("invalid-argument", "Request is missing 'eventId' or 'answers'.");
    }

    // Step 1: Save the current user's survey submission to Firestore.
    // This also serves as a record that the user has completed the survey for the event.
    const surveySubmissionRef = db.collection('event_surveys').doc(eventId).collection('submissions').doc(userId);
    await surveySubmissionRef.set({
        userId,
        eventId,
        answers,
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Step 2: Fetch the current user's profile to get their general interests.
    const userProfileSnap = await db.doc(`users/${userId}`).get();
    const currentUserInterests = userProfileSnap.data()?.interests || [];
    const currentUserData: UserSurveyData = { userId, interests: currentUserInterests, answers };

    // Step 3: Fetch all *other* survey submissions for the same event.
    const otherSubmissionsSnap = await db.collection('event_surveys').doc(eventId).collection('submissions')
        .where('userId', '!=', userId).get();

    // If no one else has taken the survey, save an empty grid and finish.
    if (otherSubmissionsSnap.empty) {
        await db.doc(`/event_grids/${eventId}/grids/${userId}`).set({
            userId,
            matches: [],
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { status: 'NO_MATCHES', message: 'Survey submitted. No other users to match with yet.' };
    }
    
    // Step 4: Fetch the profiles for all other participants to get their interests.
    const potentialMatchesData: UserSurveyData[] = await Promise.all(
        otherSubmissionsSnap.docs.map(async (doc) => {
            const submission = doc.data();
            const profileSnap = await db.doc(`users/${submission.userId}`).get();
            const interests = profileSnap.data()?.interests || [];
            return {
                userId: submission.userId,
                interests,
                answers: submission.answers,
            };
        })
    );

    // Step 5: Calculate a compatibility score for each potential match.
    const scores: { userId: string; score: number }[] = potentialMatchesData.map(matchData => {
        const score = calculateCompatibility(currentUserData, matchData);
        return { userId: matchData.userId, score };
    });

    // Step 6: Rank the matches by score (highest first) and select the top 3.
    scores.sort((a, b) => b.score - a.score);
    const top3Matches = scores.slice(0, 3).map(match => ({ userId: match.userId, compatibilityScore: match.score }));

    // Step 7: Save the final grid result to Firestore.
    // The app will read from this location to display the matches.
    const gridRef = db.doc(`/event_grids/${eventId}/grids/${userId}`);
    await gridRef.set({
        userId,
        matches: top3Matches,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { status: 'SUCCESS', message: `Successfully found ${top3Matches.length} matches.`, matches: top3Matches };
});
