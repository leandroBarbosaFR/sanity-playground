import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (structureBuilder) =>
  structureBuilder.list()
    .title('Content')
    .items(structureBuilder.documentTypeListItems())
