export type User = {
  id: string
  username: string
}

export type UserSettings = {
  main_currency_code: string
}

export type Category = {
  id: string
  name: string
  is_income: boolean
}

export type RecordItem = {
  id: string
  name: string
  amount: number
  currency_code: string
  category_id: string
  date: string
  pending?: boolean
}

export type RecordsResponse = {
  records: RecordItem[]
  total_count: number
}

export type CategoriesResponse = {
  categories: Category[]
  total_count: number
  limit: number
  offset: number
}

// Friends

export type PublicUser = {
  id: string
  username: string
}

export type FriendRelation = {
  id: string // friendship record ID
  user_id: string // the other user's ID
  pending: boolean
  nickname: string // display name: custom nickname or username as default
}

export type FriendsListResponse = {
  friends: FriendRelation[]
  total_count: number
  limit: number
  offset: number
}

// Splits

export type SplitParticipant = {
  user_id: string
  amount: number
}

export type CreateSplitPayload = {
  idempotency_key: string
  total_amount: number
  currency_code: string
  description: string
  date: string
  category_id: string
  splits: SplitParticipant[]
}

export type CreateSplitResponse = {
  split_id: string
  payer_record_id: string
  pending_record_ids: string[]
}

export type SplitListItem = {
  record_id: string
  split_id: string
  description: string
  date: string
  amount: number
  currency_code: string
  debtor_user_id: string
  creditor_user_id: string
  counterparty_user_id: string
  counterparty_name: string
  requested_by_user_id: string
  requested_by_name: string
  pending: boolean
  settle: boolean
  direction: 'you_owe' | 'they_owe_you'
}

export type SplitListResponse = {
  splits: SplitListItem[]
  total_count: number
  limit: number
  offset: number
}
