import { articleExpansionPart1 } from './articleExpansionParts/part1'
import { articleExpansionPart2 } from './articleExpansionParts/part2'
import { articleExpansionPart3 } from './articleExpansionParts/part3'
import { articleExpansionPart4 } from './articleExpansionParts/part4'
import { articleExpansionPart5 } from './articleExpansionParts/part5'
import { articleExpansionPart6 } from './articleExpansionParts/part6'
import { articleExpansionPart7 } from './articleExpansionParts/part7'
import { articleExpansionPart8 } from './articleExpansionParts/part8'
import { articleExpansionPart9 } from './articleExpansionParts/part9'
import { articleExpansionPart10 } from './articleExpansionParts/part10'

export const articleExpansions: Readonly<Record<string, string>> = Object.freeze({
  ...articleExpansionPart1,
  ...articleExpansionPart2,
  ...articleExpansionPart3,
  ...articleExpansionPart4,
  ...articleExpansionPart5,
  ...articleExpansionPart6,
  ...articleExpansionPart7,
  ...articleExpansionPart8,
  ...articleExpansionPart9,
  ...articleExpansionPart10,
})
