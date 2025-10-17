export interface Notice {
  id: string
  title: string
  content: string
  is_active: boolean
  is_pinned: boolean
  view_count: number
  created_at: string
  updated_at: string
  created_by?: string
}