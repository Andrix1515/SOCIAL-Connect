import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data, error } = await supabase
      .from('dashboard_users')
      .select('id,email,full_name,avatar_url,created_at,interests_count,interest_names,interest_categories')

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(200).json({ data })
  } catch (err) {
    res.status(500).json({ error: 'Unexpected error' })
  }
}
