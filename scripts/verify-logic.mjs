// 纯逻辑自检（无需任何依赖）：npm run verify
// 校验牌型识别 / 计分公式 / Joker 叠加 / 盲注奖励 / AI 出牌
import { buildDeck, detectHand, scoreHand, cardValue } from '../src/game/cards.js'
import { getJokerById } from '../src/game/jokers.js'
import { BLINDS, blindReward } from '../src/game/blinds.js'
import { bestPlay, shopSuggestion } from '../src/game/ai.js'

let pass = 0,
  fail = 0
const eq = (name, got, want) => {
  if (JSON.stringify(got) === JSON.stringify(want)) pass++
  else {
    fail++
    console.log(`FAIL ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`)
  }
}
const deck = buildDeck()
const card = (s, r) => deck.find((x) => x.suit === s && x.rank === r)

eq('52张', deck.length, 52)
eq('A=11', cardValue('A'), 11)
eq('K=10', cardValue('K'), 10)

eq('同花顺', detectHand([card('heart', '5'), card('heart', '6'), card('heart', '7'), card('heart', '8'), card('heart', '9')]), 'straightFlush')
eq('轮子A2345', detectHand([card('spade', 'A'), card('spade', '2'), card('spade', '3'), card('spade', '4'), card('spade', '5')]), 'straightFlush')
eq('10JQKA', detectHand([card('club', '10'), card('club', 'J'), card('club', 'Q'), card('club', 'K'), card('club', 'A')]), 'straightFlush')
eq('四条', detectHand([card('spade', '9'), card('heart', '9'), card('diamond', '9'), card('club', '9'), card('club', '2')]), 'fourKind')
eq('葫芦', detectHand([card('spade', '9'), card('heart', '9'), card('diamond', '9'), card('club', '2'), card('heart', '2')]), 'fullHouse')
eq('同花', detectHand([card('heart', '2'), card('heart', '5'), card('heart', '7'), card('heart', '9'), card('heart', 'J')]), 'flush')
eq('顺子', detectHand([card('spade', '5'), card('heart', '6'), card('diamond', '7'), card('club', '8'), card('heart', '9')]), 'straight')
eq('三条', detectHand([card('spade', '9'), card('heart', '9'), card('diamond', '9'), card('club', '2'), card('heart', '5')]), 'threeKind')
eq('两对', detectHand([card('spade', '9'), card('heart', '9'), card('diamond', '2'), card('club', '2'), card('heart', '5')]), 'twoPair')
eq('对子', detectHand([card('spade', '9'), card('heart', '9'), card('diamond', '2'), card('club', '3'), card('heart', '5')]), 'pair')
eq('高牌', detectHand([card('spade', '9'), card('heart', '7'), card('diamond', '2'), card('club', '3'), card('heart', '5')]), 'highCard')
eq('4张同花≠同花', detectHand([card('heart', '2'), card('heart', '5'), card('heart', '7'), card('heart', '9')]), 'highCard')

eq('对子55=40', scoreHand([card('spade', '5'), card('heart', '5')], []).score, 40)
eq('高牌K=15', scoreHand([card('spade', 'K')], []).score, 15)
eq('皇家同花顺=1208', scoreHand([card('heart', '10'), card('heart', 'J'), card('heart', 'Q'), card('heart', 'K'), card('heart', 'A')], []).score, 1208)

const J = (id) => ({ ...getJokerById(id) })
eq('小丑对子55=120', scoreHand([card('spade', '5'), card('heart', '5')], [J('joker')]).score, 120)
eq('学者AA=320', scoreHand([card('spade', 'A'), card('heart', 'A')], [J('scholar')]).score, 320)
eq('红心含♥=160', scoreHand([card('heart', '5'), card('spade', '5')], [J('heart_collector')]).score, 160)
eq('红心无♥=40', scoreHand([card('spade', '5'), card('club', '5')], [J('heart_collector')]).score, 40)
eq('梅花含♣=160', scoreHand([card('club', '5'), card('spade', '5')], [J('club_lover')]).score, 160)
eq('皇家KK=600', scoreHand([card('spade', 'K'), card('heart', 'K')], [J('royal_face')]).score, 600)
eq('同花顺大师=7830', scoreHand([card('club', '5'), card('club', '6'), card('club', '7'), card('club', '8'), card('club', '9')], [J('flush_master')]).score, 7830)
eq('叠加小丑→红心=480', scoreHand([card('heart', '5'), card('spade', '5')], [J('joker'), J('heart_collector')]).score, 480)
eq('叠加红心→小丑=240', scoreHand([card('heart', '5'), card('spade', '5')], [J('heart_collector'), J('joker')]).score, 240)

eq('盲注目标', BLINDS.map((b) => b.target), [300, 500, 800])
eq('剩4手=9', blindReward(4), 9)
eq('剩0手=5', blindReward(0), 5)

{
  const hand = [card('club', '5'), card('club', '6'), card('club', '7'), card('club', '8'), card('club', '9'), card('spade', '2'), card('diamond', '3'), card('heart', 'K')]
  const best = bestPlay(hand, [J('flush_master')])
  eq('AI选同花顺', best.length === 5 && best.every((c) => c.suit === 'club'), true)
}
eq('AI手牌≤5全选', bestPlay([card('spade', '2'), card('heart', '3'), card('club', '4')], []).length, 3)
eq('商店建议flush_master', shopSuggestion([J('joker'), J('flush_master'), J('scholar')].map((j) => ({ ...j, sold: false }))), 'flush_master')

console.log(`SUMMARY pass=${pass} fail=${fail}`)
process.exit(fail ? 1 : 0)
