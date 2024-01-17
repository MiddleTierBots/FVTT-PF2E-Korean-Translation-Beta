const koModule = 'pf2e-ko';

const keepOriginalName = {
    actor: false,
    item: false,
    actorItem: false
}

function nameConverter(data, translation, keepOriginal) {
    if (!translation)
        return data;
    if (keepOriginal && data !== translation) {
        return `${translation} ${data}`;
    }
    return translation;
}

const actorNameConverter = (d, t) => nameConverter(d, t, keepOriginalName.actor);
const itemNameConverter = (d, t) => nameConverter(d, t, keepOriginalName.item);
const actorItemNameConverter = (d, t) => nameConverter(d, t, keepOriginalName.actorItem);


function carefulMerge(data, translation) {
    if (!translation) {
        return data;
    }
    if (typeof data !== 'object') {
        return translation;
    }
    if (Array.isArray(data)) {
        return data.map((d, i) => carefulMerge(d, translation[i]));
    }
    let result = {};
    for (const k in data) {
        result[k] = carefulMerge(data[k], translation[k]);
    }
    return result;
}

const idRemaps = {
    "OyFCwQuw8XRazsNr": "SUKaxVZW2TlM8lu0",
    "RneiyehRO6f7LP44": "SUKaxVZW2TlM8lu0",
    "kl2q6JvBZwed4B6v": "WBmvzNDfpwka3qT4",
    "hkfH9Z53hPzcOwNB": "i35dpZFI7jZcRoBo",
    "l4LFwY7iuzX6sDXr": "7DN13ILADW2N9Z1t",
    "c2bTWBNO1BYX4Zfg": "PRrZ7anETWPm90YY"
}

function actorItemConverter(item, t) {
    // Знания и навыки
    if (item.type === 'lore') {
        let variants = t?.variants;
        if (variants)
            variants = Object.fromEntries(Object.entries(variants).map(([k, v]) => [k, { label: v }]));
        return carefulMerge(item, { name: t?.name, system: { variants: variants } });
    }

    if (['spellcastingEntry', 'melee', 'ranged', 'action'].includes(item.type))
        return carefulMerge(item, { name: actorItemNameConverter(item.name, t?.name), system: { description: { value: t?.description } } });

    let source = item.flags?.core?.sourceId;
    let sourceItem;
    if (source) {
        const m = source.match(/^Compendium\.(.+)\.Item\.(.*)$/);
        if (m) {
            const sourceId = idRemaps[m[2]] ?? m[2];
            let p = game.packs.get(m[1]).index.get(sourceId);
            if (p) {
                let fp = game.babele.converters.fromPack([p])[0];
                sourceItem = carefulMerge(fp, { name: fp.name.replace(` ${fp.originalName}`, "") });
            }
        }
    }
    t = { _id: item._id, name: t?.name, system: { description: { value: t?.description, gm: t?.system?.description?.gm }, rules: t?.system?.rules } };
    if (sourceItem) {
        t = carefulMerge(sourceItem, t);
    }

    if (t) {
        return carefulMerge(item, carefulMerge(t, { name: actorItemNameConverter(item.name, t.name) }));
    }
    return item;
}

function actorItemCollectionConverter(data, translation) {
    if (!translation) return data;
    return data.map(item => {
        const t = Array.isArray(translation) ? translation.find(t => t.id === item._id) : translation[item._id];
        return actorItemConverter(item, t);
    });
}

export function babeleInit() {
    keepOriginalName.item = game.settings.get(koModule, "babeleItemKeepOriginalName");
    keepOriginalName.actor = game.settings.get(koModule, "babeleActorKeepOriginalName");
    keepOriginalName.actorItem = game.settings.get(koModule, "babeleActorItemKeepOriginalName");

    if (typeof game.babele !== 'undefined') {
        game.babele.registerConverters({ carefulMerge, itemNameConverter, actorNameConverter, actorItemCollectionConverter });

        game.babele.register({
            module: koModule,
            lang: 'ko',
            dir: 'compendium'
        });
    }

    Hooks.once('babele.ready', () => {
        Hooks.once('babele.ready', async () => {
            for (const pack of game.packs.values()) {
                if (pack.size > 0) {
                    for (const k of pack.keys()) {
                        pack.delete(k);
                    }
                }
            }

            // обновим ссылки в чате
            const links = $('a[class=content-link]');
            for (const link of links) {
                const packId = link.attributes.getNamedItem('data-pack')?.value;
                const dataId = link.attributes.getNamedItem('data-id')?.value;
                if (!packId || !dataId)
                    continue;
                // Найдем в ссылке текст и сверим его с оригинальным названием
                let textNode = [...link.childNodes].find(n => n.nodeType === 3);
                if (textNode) {
                    const k = textNode.textContent;
                    const t = game.babele.packs.get(packId)?.translations?.[k];
                    if (t)
                        textNode.textContent = nameConverter(k, t.name);
                }
            }
        });
    });
}

function registerModule(moduleId) {
    if (game.modules.get(moduleId)?.active) {
        game.babele.register({
            module: koModule,
            lang: 'ko',
            dir: `compendium/${moduleId}`
        });
    }
}
