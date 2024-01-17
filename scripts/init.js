import { babeleInit } from "./babele.js";

const koModule = 'pf2e-ko';

Hooks.once('init', async function () {

	const corePath = `modules/${koModule}`;

	const systemFiles = ["ko.json", "re-ko.json", "kingmaker-ko.json", "pf2e-workbench-ko.json", "action-ko.json"];

	game.settings.register(koModule, 'translateSystem', {
		name: "Pathfinder 2e 시스템 번역",
		scope: 'world',
		type: Boolean,
		config: true,
		default: true,
		restricted: true,
		requiresReload: true
	});

	game.settings.register(koModule, 'itemDeclination', {
		name: "생성된 아이템 이름의 자동 변경",
		hint: "재료나 룬이 포함된 경우. 현재 방패와 강타 밴드에는 작동하지 않습니다.",
		scope: 'world',
		type: Boolean,
		config: true,
		default: true,
		restricted: true,
		requiresReload: true
	});

	game.settings.register(koModule, 'babeleShowEdited', {
		name: "편집 표시 보이기",
		hint: "아이템이 웹사이트의 번역과 다를 경우, 수집기에서 이름 옆에 별표가 표시됩니다. 이미 추가된 아이템, 생물/위험 요소에는 영향을 미치지 않습니다.",
		scope: 'world',
		type: Boolean,
		config: true,
		default: false,
		restricted: true,
		requiresReload: true
	});

	game.settings.register(koModule, 'babeleItemKeepOriginalName', {
		name: "아이템의 원래 이름 유지",
		hint: "가져온 항목은 한국어와 영어 이름을 포함합니다.",
		scope: 'world',
		type: Boolean,
		config: true,
		default: false,
		restricted: true,
		requiresReload: true
	});

	game.settings.register(koModule, 'babeleActorKeepOriginalName', {
		name: "배우의 원래 이름 유지",
		scope: 'world',
		type: Boolean,
		config: true,
		default: false,
		restricted: true,
		requiresReload: true
	});

	game.settings.register(koModule, 'babeleActorItemKeepOriginalName', {
		name: "배우에게 속한 아이템의 원래 이름 유지",
		scope: 'world',
		type: Boolean,
		config: true,
		default: false,
		restricted: true,
		requiresReload: true
	});

	if (typeof libWrapper === "function") {
		libWrapper.register(koModule,
			"game.i18n._getTranslations",
			loadSelectedTranslations,
			"MIXED");
	}
	else {
		new Dialog({
			title: "Выбор перевода",
			content: `<p>Для работы модуля перевода необходимо активировать модуль <b>libWrapper</b></p>`,
			buttons: {
				done: {
					label: "Хорошо",
				},
			},
		}).render(true);
	}

	async function loadSelectedTranslations(wrapped, lang) {
		if (lang !== 'ru')
			return wrapped(lang);

		const defaultTranslations = await wrapped(lang);
		const promises = [];

		if (game.i18n.lang != "ru")
			return defaultTranslations;

		if (game.settings.get(koModule, "translateSystem")) {
			systemFiles.forEach(f => {
				promises.push(this._loadTranslationFile(`${corePath}/${f}`));
			});
		}

		moduleFiles?.forEach(t => {
			if (game.settings.get(koModule, "translateModule_" + t.id)) {
				promises.push(this._loadTranslationFile(t.path));
			}
		});

		await Promise.all(promises);
		for (let p of promises) {
			let json = await p;
			foundry.utils.mergeObject(defaultTranslations, json, { inplace: true });
		}

		return defaultTranslations;
	}

	babeleInit();

	if (game.settings.get(koModule, "itemDeclination"))
		renameItems();

});