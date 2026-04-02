// GET /api/conseiller/activites/categories — Liste des catégories d'activité

import { db } from '@/data/db'
import { categorieActivite } from '@/data/schema'
import { eq, asc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

const SEED_CATEGORIES = [
  { code: 'recherche_emploi', label: "Recherche d'emploi", icone: '💼', couleur: '#3B82F6', ordre: 1 },
  { code: 'formation', label: 'Formation', icone: '📚', couleur: '#8B5CF6', ordre: 2 },
  { code: 'permis', label: 'Permis de conduire', icone: '🚗', couleur: '#F59E0B', ordre: 3 },
  { code: 'sante', label: 'Santé / bien-être', icone: '🏥', couleur: '#10B981', ordre: 4 },
  { code: 'sport', label: 'Sport / activité physique', icone: '⚽', couleur: '#06B6D4', ordre: 5 },
  { code: 'benevolat', label: 'Bénévolat / engagement', icone: '🤝', couleur: '#EC4899', ordre: 6 },
  { code: 'dev_perso', label: 'Développement personnel', icone: '🌱', couleur: '#84CC16', ordre: 7 },
]

export async function GET() {
  try {
    let categories = await db
      .select()
      .from(categorieActivite)
      .where(eq(categorieActivite.actif, 1))
      .orderBy(asc(categorieActivite.ordre))

    // Auto-seed si table vide
    if (categories.length === 0) {
      for (const cat of SEED_CATEGORIES) {
        await db.insert(categorieActivite).values({
          id: uuidv4(),
          ...cat,
          actif: 1,
        })
      }
      categories = await db
        .select()
        .from(categorieActivite)
        .where(eq(categorieActivite.actif, 1))
        .orderBy(asc(categorieActivite.ordre))
    }

    return Response.json(categories)
  } catch (error) {
    console.error('[Categories]', error)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
