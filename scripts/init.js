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

	game.settings.register(koModule, 'babeleItemKeepOriginalName', {
		name: "아이템의 이름 원어 병행 표기",
		hint: "한국어와 영어 이름을 병행 표기합니다.",
		scope: 'world',
		type: Boolean,
		config: true,
		default: true,
		restricted: true,
		requiresReload: true
	});

	game.settings.register(koModule, 'babeleActorKeepOriginalName', {
		name: "액터의 이름 원어 병행 표기",
		scope: 'world',
		type: Boolean,
		config: true,
		default: false,
		restricted: true,
		requiresReload: true
	});

	game.settings.register(koModule, 'babeleActorItemKeepOriginalName', {
		name: "액터 내부 아이템의 이름 원어 병행 표기",
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

	async function loadSelectedTranslations(wrapped, lang) {
		if (lang !== 'ru')
			return wrapped(lang);

		const defaultTranslations = await wrapped(lang);
		const promises = [];

		if (game.i18n.lang != "ko")
			return defaultTranslations;

		if (game.settings.get(koModule, "translateSystem")) {
			systemFiles.forEach(f => {
				promises.push(this._loadTranslationFile(`${corePath}/${f}`));
			});
		}

		await Promise.all(promises);
		for (let p of promises) {
			let json = await p;
			foundry.utils.mergeObject(defaultTranslations, json, { inplace: true });
		}

		return defaultTranslations;
	}

	babeleInit();
});