import {SimpleAction} from "../action.js"
import {default as i18n} from "../../lang/pf2e-i18n.js"
import RelativeConditions from "../model/relative-conditions.js"
import Condition, { UUID_CONDITONS } from "../model/condition.js"
import DCHelper from "../helpers/dc-helper.js"

export default class ActionHide extends SimpleAction {
	constructor(MKS) {
		super(MKS, {action: 'hide', gmActs: true,
			checkType: 'skill[stealth]',
			traits: ['secret'],
			icon: "systems/pf2e/icons/spells/zealous-conviction.webp",
			tags: ['stealth'],
			actionGlyph: 'A',
			targetCount: 2,
			requiresEncounter: true,
			opposition: 'enemy',
		})
	}

	async apply(engagement, result) {
		const concealed = new Condition(engagement.initiator, 'concealed').exists
		const relative = new RelativeConditions()
		if (!relative.isOk) return

		for (const target of engagement.targets) {
			const dc =  target.actor.perception.dc.value, awareness = relative.getAwarenessTowardMe(target), cover = relative.getMyCoverFrom(target) ?? 1
			if (awareness < 3 || (cover < 2 && !concealed))
				continue
			const coverBonus = Math.max(0, 2 * (cover-1))
			const degree = DCHelper.calculateRollSuccess(result.roll, dc - coverBonus)
			if (degree < 2) {
				const message = i18n.$$('PF2E.Actions.Hide.Result', {target: target.name, conditionRef: `@UUID[${UUID_CONDITONS.observed}]`})
				this.messageToChat(engagement.initiator, message, true)
			}
			else {
				relative.setAwarenessTowardMe(target, Math.min(awareness, 2))
				const message = i18n.$$('PF2E.Actions.Hide.Result', {target: target.name, conditionRef: `@UUID[${UUID_CONDITONS.hidden}]`})
				this.messageToChat(engagement.initiator, message, true)
			}
		}
	}
}