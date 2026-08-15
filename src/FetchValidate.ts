import * as Model from './Model'
import type * as ZodTypings from 'zod'
import z from 'zod'
import * as Util from './Util'

type tZodIssueExtended = z.core.$ZodIssue & { values: any[] }
export const $NON_EXISTANT$ = Symbol('non-existant')
class ZodModelValidator {
    issues: (ZodTypings.ZodIssue&{type_name: string, values: any[] })[] = []

    validate<zType extends ZodTypings.ZodType>(Type: zType, value: unknown, type_name: string): value is ZodTypings.output<zType> {
        try {
            Type.parse(value)
            return true
        } catch (err) {
            if (err instanceof z.ZodError) {
                for (let issue of err.issues) {
                    let value_branch = value
                    let array_value_branch = [value_branch]
                    for (let i = 0; i < issue.path.length; ++i) {
                        let path_segment = issue.path[i]

                        if (value_branch === null || !(typeof value_branch === 'object')) {
                            throw new Model.AmsterdamError('progammer brain error', {})
                        }
                        if (!(path_segment in value_branch)) {
                            array_value_branch.push($NON_EXISTANT$)
                        } else {
                            let object_branch = value_branch as { [key: string | number | symbol]: unknown }

                            value_branch = object_branch[path_segment]
                            array_value_branch.push(value_branch)
                        }
                    }
                    let issue_extended = Object.assign(issue, {
                        type_name: type_name,
                        values: array_value_branch,
                    })

                    this.issues.push(issue_extended)
                }
            }
            return false
        }
    }

    finish() {
        if (this.issues.length === 0) return

        for (let issue of this.issues) {
            console.log(issue.type_name, issue.code, issue.path, issue.values)
        }

        throw new Model.AmsterdamError('validation', { issues: this.issues })
    }
}

// optional properties that do not conflict with Typescript exactOptionalPropertyTypes
// type with optional properties must come first.
//   => It uses a fallback mechanism.
// TODO? better optional properties
function zod_object_with_option_properties<
    zRequired extends ZodTypings.ZodRawShape,
    zOptional extends ZodTypings.ZodRawShape & Partial<Record<keyof zRequired, ZodTypings.ZodType>>
>(def_required: zRequired, def_optional: zOptional) {
    let Required = z.object(def_required)
    let RequiredAndOptional = Required.extend(def_optional)
    let Object = z.union([RequiredAndOptional, Required])
    return Object
}

type tStadsdeel = { name: string, stadsdelen: Map<string, tStadsdeel> }

export default function validate(data: {
    stadsdelen_array_YAML: any,
    foto_array_YAML: any,
    gebouw_array_YAML: any,
    museum_array_YAML: any,
    eye_posters_array_YAML: any,
    world_press_photo_2025_array_YAML: any,
    activiteit_array_YAML: any,
    plek_array_YAML: any,
    landen_mob_YAML: any,
    stijlen_mob_YAML: any,
}) {
    let zod_model_validator = new ZodModelValidator()
    let StadsdeelBranchYAML = z.union([z.string(), z.record(z.string(), z.lazy(() => StadsdeelArrayYAML))])
    let StadsdeelArrayYAML: ZodTypings.ZodType<Model.tStadsdeelYAML[]> = z.array(StadsdeelBranchYAML)
    zod_model_validator.validate(StadsdeelArrayYAML, data.stadsdelen_array_YAML, 'stadsdeel')
    
    let stadsdeel_map = (function () {
        let stadsdeel_parent_branch_array: tStadsdeel[] = []
        let stadsdeel_map: Map<string, tStadsdeel> = new Map()
        add_to_map(data.stadsdelen_array_YAML)

        return stadsdeel_map

        function add_to_map(stadsdeel_array_yaml: Model.tStadsdeelYAML[]) {
            for (let stadsdeel_yaml of stadsdeel_array_yaml) {
                if (typeof stadsdeel_yaml === 'object') {
                    let { key, value } = Util.get_single_entry(stadsdeel_yaml)

                    // could be just a map
                    let stadsdeel = {
                        name: key,
                        stadsdelen: new Map(),
                    }
                    stadsdeel_map.set(stadsdeel.name, stadsdeel)
                    for (let stadsdeel_branch_parent of stadsdeel_parent_branch_array) {                     
                        stadsdeel_branch_parent.stadsdelen.set(key, stadsdeel)
                    }
                    stadsdeel_parent_branch_array.push(stadsdeel)
                    add_to_map(value)
                    stadsdeel_parent_branch_array.pop()
                } else if (typeof stadsdeel_yaml === 'string') {
                    let stadsdeel = {
                        name: stadsdeel_yaml,
                        stadsdelen: new Map()
                    }
                    stadsdeel_map.set(stadsdeel.name, stadsdeel)
                    for (let stadsdeel_branch_parent of stadsdeel_parent_branch_array) {                     
                        stadsdeel_branch_parent.stadsdelen.set(stadsdeel_yaml, stadsdeel)
                    }
                }
            }
        }
    })();

    let stadsdeel_array = [...stadsdeel_map.keys()]

    let PlekYAML = z.object({
        type: z.enum(['straat', 'plein', 'gracht', 'rivier', 'dok', 'kade', 'park']),
        naam: z.string()
    })

    /** Gebouw */
    let LinkYAML = z.object({
        ['amsterdamopdekaart.nl']: z.optional(z.string()),
        ['arcam.nl']: z.optional(z.string()),
        architect: z.optional(z.array(z.string())),
    })

    let GebouwYAML = z.strictObject({
        naam: z.string(),
        bijnaam: z.optional(z.string()),
        groep: z.optional(z.string()),
        wijk: z.enum(stadsdeel_array),
        buurt: z.optional(z.enum(stadsdeel_array)),
        eiland: z.optional(z.string()),
        architect: z.array(z.string()),
        bouwjaar: z.optional(z.number()
            .gte(1)
            .lte(2025)),
        stijl: z.optional(z.string()),
        functie: z.array(z.string()),
        plek: z.array(PlekYAML),
        interieur: z.array(z.string()),
        link: z.optional(LinkYAML),
        hoogte: z.number().int().positive()
    }).partial({
        interieur: true,
        link: true,
        hoogte: true,
    }).refine(x => {
        if (x.buurt === undefined) return true

        let wijk_stadsdelen = stadsdeel_map.get(x.wijk)
        if (wijk_stadsdelen === undefined) throw new Error()
        
        return wijk_stadsdelen.stadsdelen.has(x.buurt)
    }, {
        path: ['buurt'],
        message: 'buurt not in wijk',
    })

    let GebouwArrayYAML = z.array(GebouwYAML)
    zod_model_validator.validate(GebouwArrayYAML, data.gebouw_array_YAML, 'gebouw')

    let gebouw_array = data.gebouw_array_YAML.map((x: any) => x.naam)
    let poster_array = data.eye_posters_array_YAML.map((x: any) => x.naam)

    let world_press_photo_2025_array = data.world_press_photo_2025_array_YAML.map((x: any) => x.key)
    let museum_array = data.museum_array_YAML.map((x: any) => x.naam)
    let tentoonstelling_array = data.museum_array_YAML.flatMap((x: any) => x.tentoonstelling.map((y: any) => y.naam))
    let interieur_array = data.gebouw_array_YAML.flatMap((x: any) => x.interieur)
    let rivier_array = data.plek_array_YAML.filter((x: any) => x.type === 'rivier').map((x: any) => x.naam)               
    let gracht_array = data.plek_array_YAML.filter((x: any) => x.type === 'gracht').map((x: any) => x.naam)
    let straat_array = data.plek_array_YAML.filter((x: any) => x.type === 'straat').map((x: any) => x.naam)

    /** Foto's */    
    let FotoOnderwerpYAML = z.discriminatedUnion('type', [
       z.object({
            type: z.literal('persoon'),
            key: z.enum(['ikke', 'Herbert'])
        }), z.object({
            type: z.literal('gebouw'),
            key: z.enum(gebouw_array)
        }), z.object({
            type: z.literal('stadsdeel'),
            key: z.enum(stadsdeel_array)
        }), z.object({
            type: z.literal('poster'),
            key: z.enum(poster_array)
        }), z.object({
            type: z.literal('world_press_photo_2025'),
            key: z.enum(world_press_photo_2025_array),
        }), z.object({
            type: z.literal('museum'),
            key: z.enum(museum_array)
        }), z.object({
            type: z.literal('tentoonstelling'),
            key: z.enum(tentoonstelling_array),
            parent_key: z.enum(museum_array),
        }), z.object({
            type: z.literal('interieur'),
            key: z.enum(interieur_array),
            parent_key: z.enum(gebouw_array),
        }), z.object({
            type: z.literal('rivier'),
            key: z.enum(rivier_array), 
        }), z.object({
            type: z.literal('gracht'),
            key: z.enum(gracht_array),
        }), z.object({
            type: z.literal('straat'),
            key: z.enum(straat_array),
        }), z.object({
            type: z.literal('voorwerp'),
            key: z.string(),
        }), z.object({
            type: z.literal('plein'),
            key: z.string(),
        }), z.object({
            type: z.literal('kade'),
            key: z.string(),
        }), z.object({
            type: z.literal('dok'),
            key: z.string(),
        })
    ])

    let FotoYAML = z.object({
        bestand: z.string(),
        onderwerp: z.array(FotoOnderwerpYAML)
    })
    let FotoArrayYAML = z.array(FotoYAML)

    zod_model_validator.validate(FotoArrayYAML, data.foto_array_YAML, 'foto')

    /** Museum */
    let TentoonstellingYAML = z.object({
        naam: z.string(),
    })
    let MuseumYAML = z.object({
        naam: z.string(),
        tentoonstelling: z.array(TentoonstellingYAML)
    })
    let MuseumArrayYAML = z.array(MuseumYAML)

    MuseumArrayYAML.parse(data.museum_array_YAML)
    zod_model_validator.validate(MuseumArrayYAML, data.museum_array_YAML, 'museum')

    /** World Press Photo 2025 */
    let WorldPressPhoto2025YAML = z.object({
        key: z.string(),
        reeks: z.string(),
        nummer: z.optional(z.number()),
        web: z.url(),
        maker: z.string(),
        comment: z.object({
            en: z.string(),
            nl: z.string(),
        }),
    })
    let WorldPressPhoto2025ArrayYAML = z.array(WorldPressPhoto2025YAML)
    zod_model_validator.validate(WorldPressPhoto2025ArrayYAML, data.world_press_photo_2025_array_YAML, 'world_press_photo_2025')

    /** EYE Poster */
    const EYEPosterYAML = z.object({
        naam: z.string(),
        film: z.object({
            jaar: z.int().gte(1).lte(2025),
            regisseur: z.array(z.string()),
            land: z.array(z.string()),
        }),
        poster: z.object({
            jaar: z.int().gte(1).lte(2025),
            ontwerper: z.array(z.string()),
            land: z.array(z.string()),
        })
    })
    const EYEPosterArrayYAML = z.array(EYEPosterYAML)
    EYEPosterArrayYAML.parse(data.eye_posters_array_YAML)
    zod_model_validator.validate(EYEPosterArrayYAML, data.eye_posters_array_YAML, 'eye_poster')

    /* activiteit */
    let ActiviteitYAML = z.string()
    let ActiviteitArrayYAML = z.array(ActiviteitYAML)
    zod_model_validator.validate(ActiviteitArrayYAML, data.activiteit_array_YAML, 'activiteit')

    /* plek */
    const PlekArrayYAML = z.array(PlekYAML)
    zod_model_validator.validate(PlekArrayYAML, data.plek_array_YAML, 'plek')
    
    /** Land Vertaling */
    let LandVertalingYAML = z.object({}).catchall(z.string())
    LandVertalingYAML.parse(data.landen_mob_YAML)

    zod_model_validator.finish()
}