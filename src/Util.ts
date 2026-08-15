import * as React from 'react'
import * as Model from './Model'

export function find_in_array_by_item_property_or_throw<TV extends { [key: string]: any }>(collection: TV[], property_path_element: string[], search_value: string, error_message: string): TV {
    let element_found = collection.find((x) => {
        let s = pick(x, property_path_element)
        return s === search_value
    })
    if (element_found === undefined) {
        throw new Model.AmsterdamError(error_message, {
            collection: collection,
            property_path_element: property_path_element,
            search_value: search_value,
        })
    }
    return element_found
}

export function find_in_array_or_throw<TV>(collection: TV[], search_value: string, error_message: string): TV {
    let element_found = collection.find((x) => {
        return x === search_value
    })
    if (element_found === undefined) {
        throw new Model.AmsterdamError(error_message, {
            collection: collection,
            search_value: search_value,
        })
    }
    return element_found
}

export function find_in_array_by_item_property<TV extends { [key: string]: any }>(collection: TV[], property_path_element: string[], search_value: string): TV|undefined {
    let element_found = collection.find((x) => {
        let s = pick(x, property_path_element)
        return s === search_value
    })
    return element_found
}

export function get_in_map_by_key_or_throw<TK, TV extends NonNullable<unknown>>(map: Map<TK, TV>, key: TK, error_key: string): TV {
    let value = map.get(key)
    if (value === undefined) {
        throw new Model.AmsterdamError(error_key, { map: map, key: key, })
    }
    return value
}

export function get_in_mob_by_key_or_throw<TV extends NonNullable<unknown>>(mob: { [key: string]: TV }, key: string, error_key: string): TV {
    let value = mob[key]
    if (value === undefined) {
        throw new Model.AmsterdamError(error_key, { mob: mob, key: key, })
    }
    return value
}

export function get_entries<tEntryKey extends string, tEntryValue>(object: { [key in tEntryKey]: tEntryValue }): [[tEntryKey, tEntryValue]] {
    return Object.entries(object) as [[tEntryKey, tEntryValue]]
}


export function pick<TV extends { [key: string]: any }>(x: TV, property_path_element: string[]): any {
    let s = x as any

    for (let property_name of property_path_element) {
        if (typeof s !== 'object') return undefined
        if (!(property_name in s)) return undefined

        s = s[property_name]
    }

    return s
}

export function get_single_entry<tV>(x: { [key: string]: tV }) {
    for (let key in x) {
        let value = x[key]
        return { key: key, value: value }
    }

    throw new Model.AmsterdamError('no_key', { value: x })
}

export function get_ref<TV>(object: object, property_path_array: string[], ref: React.RefObject<TV>): NonNullable<TV> {
    let v = ref.current
    if (v == null) throw Model.AmsterdamError.ref_empty(object, property_path_array, ref)
    return v
}

export function parse_integer(number: string, error_key: string): number {
    if ([...number].every(x => '0' <= x && x <= '9')) {
        return Number.parseInt(number)
    } else {
        throw new Model.AmsterdamError(error_key, {
            value: number,
        })
    }
}

export function assert_defined<TV extends string|boolean|bigint|number|symbol|object|number, T>(value: TV|undefined): asserts value is TV {
  if (value === undefined) {
    throw new Model.AmsterdamError('undefined', { })
  }
}

export const Sort = (function () {
    function asc<T1, T2> (fn_key?: ((x: T1) => T2)): ((x: T1, y: T1) => number) {
        fn_key = fn_key ?? ((x: T1) => x as any as T2)

        return (x: any, y: any) => fn_key(x) < fn_key(y) ? -1 : 1
    }

    function desc<T extends string> (fn_key?: ((x: any) => T)): ((x: T, y: T) => number) {
        fn_key = fn_key ?? ((x) => x)
        return (x: any, y: any) => fn_key(x) < fn_key(y) ? 1 : -1
    }

    function place_in_array<ZElement, ZComparable>(order_array: ZComparable[], fn_get_comparable: (value: ZElement) => ZComparable, type_name: string) {
      return (value: ZElement) => {
        let comparable = fn_get_comparable(value)
        let order_index = order_array.indexOf(comparable)
        if (order_index === -1) throw new Model.AmsterdamError('order_not_defined', {
          value: value,
          type: type_name,
        })
        return order_index
      }
    }

    return {
        feature: {
            comparison: {
                asc: asc,
                desc: desc,
            },
            order: {
                place_in_array: place_in_array,
            },
        }
    }
})()

export function create_pick<ZPropertyKey extends string, ZPropertyValue, ZObject extends { [property in ZPropertyKey]: ZPropertyValue }>(property_path: ZPropertyKey) {
    return (x: ZObject) => {
        return x[property_path]
    }
}