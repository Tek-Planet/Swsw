
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

/**
 * Calls the 'holdMovieSeats' cloud function to temporarily reserve seats.
 * @param eventId The ID of the event.
 * @param seatIds The array of seat IDs to hold.
 * @returns The result from the cloud function.
 */
export const holdMovieSeats = async (eventId: string, seatIds: string[]) => {
  try {
    const holdFunction = httpsCallable(functions, 'holdMovieSeats');
    const result = await holdFunction({ eventId, seatIds });
    return result.data;
  } catch (error) {
    console.error('Error calling holdMovieSeats function:', error);
    // Re-throw the error to be handled by the calling component
    throw new Error('Failed to hold seats. Please try again.');
  }
};
