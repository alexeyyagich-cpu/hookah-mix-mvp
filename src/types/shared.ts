import type { Tobacco } from '@/data/tobaccos'
import type { BarRecipeWithIngredients } from './database'

export interface BarItemEntry {
  recipe: BarRecipeWithIngredients
  quantity: number
}

export interface SelectedTobacco {
  tobacco: Tobacco
  percent: number
}
