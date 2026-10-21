import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const sleutel = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

/** null zolang .env niet ingevuld is; de app draait dan met startdata. */
export const supabase = url && sleutel ? createClient(url, sleutel) : null
