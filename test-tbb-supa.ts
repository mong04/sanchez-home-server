import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sbUrl = process.env.VITE_SUPABASE_URL || '';
const sbKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(sbUrl, sbKey);

async function checkDateQuery() {
    const start = '2026-03-01 00:00:00';
    const end = '2026-03-31 23:59:59';

    console.log("Testing full query from budgetUtils...");

    const { data: q1, error: e1 } = await supabase
        .from('transactions')
        .select('*')
        .eq('isincome', true)
        .gte('date', start)
        .lte('date', end);

    console.log("Result lengths:", q1?.length);
    console.log("Error:", e1);

    if (e1) {
        // Fallback test
        console.log("Testing with pure dates...");
        const { data: q2, error: e2 } = await supabase
            .from('transactions')
            .select('*')
            .eq('isincome', true)
            .gte('date', '2026-03-01')
            .lte('date', '2026-03-31');

        console.log("Fallback lengths:", q2?.length);
        console.log("Fallback Error:", e2);
    }
}

checkDateQuery();
