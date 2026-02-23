import { PlannerContainer } from './planner/PlannerContainer';

/**
 * SmartPlanner Component
 * 
 * Refactored to use the new modular architecture in ./planner/
 * - PlannerContainer: Main state and layout
 * - DayView, WeekView, MonthView: Visualizations
 * - EventModal: Logic for events
 */
export function SmartPlanner() {
    return <PlannerContainer />;
}
