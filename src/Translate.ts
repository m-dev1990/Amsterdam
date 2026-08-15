import * as Model from './Model.ts'
import AmsterdamEngine from './Engine'

class Translate {
    translate(text: Model.tTextPlain | Model.tTextTranslated) {
        if (text.type === 'plain') {
            return text.value
        } else {
            return text.value[AmsterdamEngine.select_language_code()]
        }
    }
}

export default new Translate()