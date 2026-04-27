import decisionTaxonomy from '@shared/decision-taxonomy.json'

type Option = {
  id: string
  label: string
}

type DecisionTaxonomy = {
  budgetOptions: Option[]
  diningModes: Option[]
  sceneTags: Option[]
  tasteTags: Option[]
}

const taxonomy = decisionTaxonomy as DecisionTaxonomy

export const budgetOptions = taxonomy.budgetOptions
export const diningModeOptions = taxonomy.diningModes
export const sceneTagOptions = taxonomy.sceneTags
export const tasteTagOptions = taxonomy.tasteTags

export function getOptionLabel(options: Option[], id: string): string {
  return options.find((option) => option.id === id)?.label ?? id
}
