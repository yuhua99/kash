import type { User } from '$lib/core/domain/models'

declare global {
  namespace App {
    interface Locals {
      user: User | null
    }
    interface PageData {
      user: User | null
    }
  }
}

export {}
