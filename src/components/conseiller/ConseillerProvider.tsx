'use client'

import { createContext, useContext } from 'react'

export interface ConseillerInfo {
  id: string
  email: string
  prenom: string
  nom: string
  role: string
  structure: { id: string; nom: string; type: string } | null
}

const ConseillerContext = createContext<ConseillerInfo | null>(null)

export const useConseiller = () => useContext(ConseillerContext)

export function ConseillerProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: ConseillerInfo | null
}) {
  return (
    <ConseillerContext.Provider value={value}>
      {children}
    </ConseillerContext.Provider>
  )
}
