import type { BarInventoryItem, BarSale } from '@/types/database'

const t = new Date().toISOString()
const bi = (id: string, name: string, brand: string, cat: BarInventoryItem['category'], unit: string, qty: number, min: number, price: number, pkg: number, notes: string | null = null): BarInventoryItem => ({
  id, profile_id: 'demo', name, brand, category: cat, unit_type: unit as BarInventoryItem['unit_type'],
  quantity: qty, min_quantity: min, purchase_price: price, package_size: pkg,
  supplier_name: null, barcode: null, notes, created_at: t, updated_at: t,
})

export const DEMO_BAR_INVENTORY: BarInventoryItem[] = [
  // Spirits
  bi('b1', 'Bulleit Bourbon', 'Bulleit', 'spirit', 'ml', 450, 200, 28, 700),
  bi('b2', 'Beefeater Gin', 'Beefeater', 'spirit', 'ml', 380, 200, 22, 700),
  bi('b3', 'Bacardi White Rum', 'Bacardi', 'spirit', 'ml', 550, 200, 16, 700),
  bi('b9', 'Absolut Vodka', 'Absolut', 'spirit', 'ml', 620, 200, 18, 700),
  bi('b10', 'Olmeca Blanco Tequila', 'Olmeca', 'spirit', 'ml', 320, 200, 20, 700),
  bi('b11', 'Campari', 'Campari', 'spirit', 'ml', 280, 150, 16, 700),
  bi('b12', 'Aperol', 'Aperol', 'spirit', 'ml', 400, 200, 14, 700),
  bi('b13', 'Kahlúa Coffee Liqueur', 'Kahlúa', 'spirit', 'ml', 350, 150, 18, 700),
  // Syrups
  bi('b4', 'Simple Syrup', '', 'syrup', 'ml', 750, 200, 5, 1000),
  bi('b14', 'Sea Buckthorn Syrup', '', 'syrup', 'ml', 300, 150, 8, 500, 'For Leipzig Sour'),
  bi('b15', 'Honey Syrup', '', 'syrup', 'ml', 400, 150, 6, 500),
  bi('b16', 'Coconut Syrup', '', 'syrup', 'ml', 350, 100, 7, 500),
  // Juices
  bi('b5', 'Fresh Lime Juice', '', 'juice', 'ml', 120, 300, 4, 1000, 'Running low!'),
  bi('b17', 'Fresh Lemon Juice', '', 'juice', 'ml', 200, 300, 4, 1000),
  bi('b18', 'Pineapple Juice', '', 'juice', 'ml', 600, 300, 3, 1000),
  bi('b19', 'Passion Fruit Puree', '', 'juice', 'ml', 250, 150, 12, 500),
  // Mixers
  bi('b8', 'Schweppes Tonic', 'Schweppes', 'mixer', 'ml', 0, 500, 3, 1000, 'Need to order!'),
  bi('b20', 'Soda Water', '', 'mixer', 'ml', 1500, 500, 2, 1000),
  bi('b21', 'Ginger Beer', 'Fever-Tree', 'mixer', 'ml', 800, 300, 5, 500),
  bi('b22', 'Cola', 'Coca-Cola', 'mixer', 'ml', 1000, 500, 2, 1000),
  bi('b23', 'Prosecco', 'Zonin', 'mixer', 'ml', 500, 300, 8, 750),
  // Bitters & Garnish
  bi('b7', 'Angostura Bitters', 'Angostura', 'bitter', 'ml', 120, 50, 12, 200),
  bi('b6', 'Lime', '', 'garnish', 'pcs', 4, 10, 0.3, 1, 'Need to buy'),
  bi('b24', 'Fresh Mint', '', 'garnish', 'pcs', 25, 10, 0.1, 1),
  bi('b25', 'Orange', '', 'garnish', 'pcs', 6, 5, 0.4, 1),
]

export function generateDemoSales(): BarSale[] {
  const now = new Date()
  const sales: BarSale[] = []
  const cocktails = [
    { name: 'Mojito', price: 9, cost: 2.4, recipe_id: 'demo-r1' },
    { name: 'Negroni', price: 11, cost: 3.2, recipe_id: 'demo-r2' },
    { name: 'Gin & Tonic', price: 8, cost: 1.9, recipe_id: 'demo-r3' },
    { name: 'Aperol Spritz', price: 9, cost: 2.6, recipe_id: 'demo-r4' },
    { name: 'Espresso Martini', price: 11, cost: 3.0, recipe_id: 'demo-r7' },
    { name: 'Leipzig Sour', price: 12, cost: 3.5, recipe_id: 'demo-r8' },
    { name: 'Moscow Mule', price: 9, cost: 2.1, recipe_id: 'demo-r11' },
    { name: 'Tropical Hookah', price: 7, cost: 1.5, recipe_id: 'demo-r10' },
  ]

  for (let day = 0; day < 7; day++) {
    const date = new Date(now)
    date.setDate(date.getDate() - day)
    const salesPerDay = 3 + Math.floor(Math.random() * 5)

    for (let j = 0; j < salesPerDay; j++) {
      const cocktail = cocktails[Math.floor(Math.random() * cocktails.length)]
      const qty = 1 + Math.floor(Math.random() * 2)
      const revenue = cocktail.price * qty
      const cost = cocktail.cost * qty
      const margin = ((revenue - cost) / revenue) * 100

      date.setHours(14 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60))

      sales.push({
        id: `demo-sale-${day}-${j}`,
        profile_id: 'demo',
        recipe_id: cocktail.recipe_id,
        recipe_name: cocktail.name,
        quantity: qty,
        unit_price: cocktail.price,
        total_revenue: revenue,
        total_cost: cost,
        margin_percent: margin,
        table_id: null,
        guest_name: null,
        notes: null,
        sold_at: date.toISOString(),
      })
    }
  }

  return sales.sort((a, b) => new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime())
}
