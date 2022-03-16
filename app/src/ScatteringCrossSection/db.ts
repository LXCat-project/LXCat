import type { CrossSection, CrossSectionHeading } from './types'

// TODO retrieve from database
const crossSections: CrossSection[] = [{
    id: 1,
    species1: 'H+',
    species2: 'He',
    database: 'Viehland',
    group: 'Coxon',
    data: 'something',
    references: [{title:'ref1', authors:['a1'], 'container-title': 'j1'}],
    process: 'Moment Q(01)',
}, {
    id: 10,
    species1: 'He+',
    species2: 'He',
    database: 'Phelps',
    group: '',
    data: 'something',
    references: [{title:'ref1', authors:['a1'], 'container-title': 'j1'}],
    process: 'Isotropic',
}, {
    id: 7,
    species1: 'H+',
    species2: 'Ne',
    database: 'Viehland',
    group: 'Coxon',
    data: 'something',
    references: [{title:'ref1', authors:['a1'], 'container-title': 'j1'}],
    process: 'Moment Q(01)',
}, {
    id: 8,
    species1: 'H+',
    species2: 'Ar',
    database: 'Viehland',
    group: 'Coxon',
    data: 'something',
    references: [{title:'ref1', authors:['a1'], 'container-title': 'j1'}],
    process: 'Moment Q(01)',
}, {
    id: 9,
    species1: 'H+',
    species2: 'Ar',
    database: 'Viehland',
    group: 'Coxon',
    data: 'something',
    references: [{title:'ref1', authors:['a1'], 'container-title': 'j1'}],
    process: 'Moment Q(02)',
}, {
    id: 2,
    species1: 'Gd+(10D5/2,ISR)',
    species2: 'He',
    database: 'Viehland',
    group: 'Buchachenko',
    data: 'something',
    references: [{title:'ref1', authors:['a1'], 'container-title': 'j1'}],
    process: 'Moment Q(01)',
}, {
    id: 3,
    species1: 'Gd+(10D5/2,ISR)',
    species2: 'He',
    database: 'Viehland',
    group: 'Buchachenko',
    data: 'something',
    references: [{title:'ref1', authors:['a1'], 'container-title': 'j1'}],
    process: 'Moment Q(02)',
}, {
    id: 4,
    species1: 'Gd+(10D5/2,ISR)',
    species2: 'He',
    database: 'Viehland',
    group: 'Buchachenko',
    data: 'something',
    references: [{title:'ref1', authors:['a1'], 'container-title': 'j1'}],
    process: 'Moment Q(03)',
}, {
    id: 5,
    species1: 'Gd+(10D5/2,ISR)',
    species2: 'He',
    database: 'Viehland',
    group: 'Buchachenko',
    data: 'something',
    references: [{title:'ref1', authors:['a1'], 'container-title': 'j1'}],
    process: 'Moment Q(04)',
}, {
    id: 6,
    species1: 'Gd+(10D5/2,ISR)',
    species2: 'He',
    database: 'Viehland',
    group: 'Buchachenko',
    data: 'something',
    references: [{title:'ref1', authors:['a1'], 'container-title': 'j1'}],
    process: 'Moment Q(05)',
}]

function toHeading(cs: CrossSection): CrossSectionHeading {
    const {data, ...r} = cs
    return r
}

export async function search(selected: Record<string, string[]> = {}) {
    if (Object.entries(selected).length > 0) {
        return crossSections.map(toHeading).filter(d => {
            return Object.entries(selected).every(([sk, sv]) => {
                if (sv.length === 0) {
                    // No selection means select all
                    return true
                }
                return sk in d && sv.includes((d as any)[sk])
            })
        })
    }
    return crossSections.map(toHeading)
}

export async function byId(id: number) {
    const items = crossSections.filter(d => d.id === id)
    if (items.length === 1) {
        return items[0]
    }
    throw Error(`Cross section with ${id} as id does not exist`)
}

async function facet(key: keyof CrossSection) {
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#remove_duplicate_elements_from_the_array
    return [...new Set(crossSections.map(d => d[key]))]
}

export async function facets() {
    return {
        species1: await facet('species1'),
        species2: await facet('species2'),
        database: await facet('database'),
        group: await facet('group'),
        process: await facet('process'),
    }
}

async function validFacet(key: keyof CrossSection, selected: Record<string, string[]>) {
    if (selected[key].length > 0) {
        return await facet(key)
    }
    const filtered = await search(selected)
    return [...new Set(filtered.map(d => d[key]))]
}

export async function validFacets(selected: Record<string, string[]>) {
    return {
        species1: await validFacet('species1', selected),
        species2: await validFacet('species2', selected),
        database: await validFacet('database', selected),
        group: await validFacet('group', selected),
        process: await validFacet('process', selected),
    }
}