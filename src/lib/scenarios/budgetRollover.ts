
/**
 * Calculates the available amount for an envelope based on rollover logic.
 * 
 * Strategy:
 * - If current balance is positive, new allocation adds to it.
 * - If current balance is negative (overspent), it eats into the new allocation.
 * 
 * @param currentBalance The current balance of the envelope (can be negative).
 * @param allocationAmount The amount being added to the envelope.
 * @returns The new available balance.
 */
export function calculateRollover(currentBalance: number, allocationAmount: number): number {
    return currentBalance + allocationAmount;
}
