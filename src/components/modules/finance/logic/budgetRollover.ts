/**
 * Calculates the available amount for an envelope based on rollover logic.
 * @param currentBalance The current balance of the envelope (can be negative).
 * @param allocationAmount The amount being added to the envelope.
 */
export function calculateRollover(currentBalance: number, allocationAmount: number): number {
    return currentBalance + allocationAmount;
}
