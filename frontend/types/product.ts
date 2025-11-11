/**
 * Product types for marketplace
 */

export type User = {
  id: number
  email: string
  name: string | null
  picture: string | null
}

export type ProductCondition = "Neuf" | "Comme neuf" | "Très bon état" | "Bon état" | "Satisfaisant"

export type ProductCategory =
  | "Électronique"
  | "Mobilier"
  | "Mode"
  | "Sport"
  | "Automobile"
  | "Jardin"
  | "Électroménager"
  | "Musique"
  | "Livres"
  | "Jeux & Jouets"

export type Product = {
  id: number
  title: string
  description: string
  price: number
  category: ProductCategory
  location: string
  images: string[]
  condition: ProductCondition
  createdAt: string
  seller: User | null
}

/**
 * API Collection response for products
 */
export type ProductCollection = {
  "hydra:member": Product[]
  "hydra:totalItems"?: number
} | {
  member: Product[]
  totalItems?: number
}
