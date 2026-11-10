I want to make a new game called **Werewolves**, based on the Werewolves party game.

## Lobby and setup

The admin configures the lobby and selects which roles are in the role pool. Each role may appear at most once in the pool. The admin also chooses the exact number of Werewolf-aligned role cards to deal; this number cannot exceed the number of Werewolf cards in the pool. At game start, deal one distinct role card to each role-holding player, choosing randomly from the pool without duplicates and ensuring the chosen roles include the configured number of Werewolf cards. The pool must contain enough roles for all role-holding players and enough Werewolf cards for the configured count.

The lobby supports up to 20 participants in total, including the Game Master (GM). The GM occupies a separate seat and has no role. The admin and GM are separate responsibilities: the admin configures the lobby, and the GM runs the game. The admin does not have to be the GM.

The maximum number of role-holding players in the village is the number of distinct roles in the configured pool. Once that village capacity is full, additional participants may still join the lobby as spectators; spectators do not receive roles, sit in the village, or take part in game actions. The lobby must not start a game with more role-holding players than available distinct roles.

At game start, randomly select a distinct subset of roles from the pool, one for each role-holding player. The selected roles must include exactly the configured number of Werewolf roles. Any Werewolf roles in the pool may be selected; there are no additional role-selection constraints.

Before the game starts, the admin may enable an optional unanimous vote to skip lynching. When enabled, all living players, including the mayor and silenced players, vote on whether to skip the lynch before the lynch vote begins. If every living player votes to skip, there is no lynch that day; otherwise, proceed to the lynch vote.

The admin may also enable daily Moon cards. When enabled, the mayor chooses from up to three randomly offered eligible Moon cards at the start of each day. If fewer than three eligible cards remain, offer all of them; if none remain, no Moon card is played that day or for the rest of the game. Once chosen, a card is removed from the game and cannot be offered again.

Players are seated around a circular table and represented by their avatars in seating order. At game start, assign roles randomly from the configured pool as described above.

## Roles

Use the role icons in `content/werewolf` throughout the UI, accompanied by each role's name.

- **Big Bad Wolf — Werewolf:** Once per game, during the day and before voting starts, may reveal their role and kill a player of their choice outright. Their role is then revealed to everyone.
- **Cloaked Wolf — Werewolf:** Cannot be detected by the Guard's dog; does not make the Bearman's bear growl; and is not identified by the Seer.
- **Wise Wolf — Werewolf:** While alive, causes the GM to give the Werewolves a thumbs-down when they target the Old Knight, a player protected by the Old Knight, the Hunter, or the Elder. This is a warning, not a restriction: the Werewolves may reconsider any number of times, or unanimously keep the warned target.
- **Throatcutter — Werewolf:** After the Werewolves choose their kill target, may raise their hand and choose a Villager-aligned player to silence for the next day. A Wolfchild is eligible while their imitation target is alive, but not after converting to Werewolf. Werewolves and neutral players are not eligible. The Throatcutter may use this ability once per game.
- **Sniffer — Werewolf:** Wakes alone before the Werewolves and may check a player's role. On the first night only, if the Sniffer checks a Werewolf, the GM gives a thumbs-down and the Sniffer may reconsider any number of times.
- **Wolfchild — Neutral:** On the first night, before anyone has died, chooses one player to imitate. The Wolfchild does not copy that player's role. Their role remains Wolfchild, but their faction follows the chosen player's living status: they count as a Villager while that player is alive and become a Werewolf as soon as that player dies.
- **Fool — Neutral:** If selected to be lynched, reveals their role and wins individually without dying. The game continues and the Fool does not affect its normal win conditions. If the game ends because only one faction remains, a living Fool loses unless they are a living lover; lovers win together under the lover win condition. If killed by a Werewolf, the Fool loses. The Fool may continue talking, but must keep their eyes closed during the night.
- **Cupido — Villager:** On the first night, chooses two players who become lovers. If either lover dies, the other dies of heartbreak. The lovers win together if they are both alive when either faction wins, or if they are the only two players left alive.
- **Elder — Villager:** Is protected from being killed by the Werewolves; if targeted, no one appears to have been attacked. If killed by any other means, all Villagers lose their role abilities for the rest of the game.
- **Hunter — Villager:** When killed, may shoot and kill another player. If killed at night, the Hunter may shoot when their death is revealed in the morning. If killed by lynching or by the Big Bad Wolf during the day, the Hunter may shoot when that death occurs.
- **Alchemist — Villager:** Has one potion and one poison for the entire game. Each night, may use either or both. The potion may save the Werewolves' target or, if the Old Knight's protection was triggered, save the Old Knight instead. The poison kills a player chosen by the Alchemist.
- **Old Knight — Villager:** Each night, chooses another player to protect; the Old Knight cannot protect themself. If the Werewolves attack that protected player, the attack is prevented, the Old Knight dies, and the first living Werewolf to the left of the protected player in seating order also dies. This protection only applies to the Werewolves' attack.
- **Judge — Villager:** During a trial, after the result is revealed but before the selected player is killed, may reveal their role. The Judge becomes mayor and the lynch vote restarts from the beginning.
- **Little Girl — Villager:** Each night, chooses a player. The GM shows whether that player visited anyone that night. Examples of visits include a Werewolf choosing a kill target, the Throatcutter choosing a target, the Alchemist using a potion or poison, the Old Knight choosing whom to protect, the Guard checking someone, the Sniffer checking someone, or the Seer viewing a role.
- **Guard — Villager:** Each night, chooses a player for the Guard's dog to check. The GM gives a thumbs-up if the chosen player or either of their closest living neighbors in seating order is a Werewolf; otherwise, the GM gives a thumbs-down. Dead players are skipped when finding neighbors. The Cloaked Wolf is not detected.
- **Bearman — Villager:** At dawn, after deaths are resolved, the bear growls if either closest living neighbor is a Werewolf. The Cloaked Wolf does not cause a growl.
- **Seer — Villager:** Each night, may view another player's role. If the target is the Cloaked Wolf, Wolfchild, Fool, or Bearman, the GM gives a thumbs-down instead of revealing the role.

## In-game screens

After the Wolfchild chooses an imitation target, **feeling-watched** wakes that player alone. They privately learn that a Wolfchild is imitating them (not who it is) and must mark **Seen it** before the GM continues. Their own town card has an orange border during the step. Afterwards, both the Wolfchild and imitated player see that border only when **Show secret role** is enabled, while the Wolfchild lives. The GM always sees orange imitation and pink lovers' borders.

After Cupido assigns the lovers, **lovers-meet** wakes them together so they can privately see their partner. Both lovers' town cards have pink borders on their own screens during the meeting. After the meeting, the borders and partner text are visible only with **Show secret role** enabled. The GM can see them privately; other players cannot.

Before night deaths are revealed at dawn, the GM announces the Throatcutter's victim in a separate step, if the ability was used. Confirmation adds a public red dashed border to that player's town card for the day. They cannot speak but may still vote. The border disappears when night starts.

When the Fool is selected for lynching, a separate GM step asks them to reveal themselves to everyone. Once confirmed, their role remains publicly visible. The next step asks the GM to announce the Fool's individual victory; the Fool stays alive and normal play resumes.

If the Fool is mayor, they must appoint another active player during the victory step. After victory, the Fool is out of play and treated as dead for all game mechanics: they cannot vote, use abilities, be targeted by any ability, or count as a living neighbour or living Wolfchild imitation target. Their individual victory remains recorded; no death is recorded for leaving play.

Role-holding players see their own role and the seating order. A rules tab opens a modal showing the game rules, all role rules, and the roles in this game's pool. Spectators see public information only; they do not see roles or private actions.

The GM sets the seating order, can see every player's role, and sees a prompt for the next step with a control to confirm it. The GM also sees a table of the remaining steps for the current day and following night, or for the current night and following day. The GM can open the same rules modal as the players.

The game must work both for remote players who cannot see one another and for players together in person. Each player has a toggle to hide secret information before showing their screen to others.

## Win conditions

A Werewolf faction victory is awarded to every Werewolf-aligned player, including dead Werewolves and converted Wolfchildren, not only survivors.

The Wolfchild's faction is fixed when they die. A Wolfchild who died as a Villager wins with the Villagers; one who died as a Werewolf wins with the Werewolves. Their imitation target dying after them cannot change their faction or victory eligibility.

The Fool is ignored when checking faction win conditions. If no Villagers and no Werewolves remain, the game is a draw. Otherwise, the Villagers win when no Werewolves remain, and the Werewolves win when no Villagers remain. The Wolfchild counts as a Villager or Werewolf according to their current alignment. A living Fool loses when either faction wins unless they are one of the living lovers; lovers win together under the lover win condition. If the lovers are the only two players alive, they win together. If both lovers are Werewolves, they can win as part of the Werewolf faction.

## GM flow

Show a step only when its role is in the pool and is not known by everyone to be dead. If a role is in the pool but was not dealt, show a GM-only **Pretend** step at its normal action moment: the GM pauses as if performing it, then confirms to continue. Pretend steps have no player UI, selections, results, or gameplay effects. Death-triggered abilities still require an actual death. Steps marked **[UI]** need a GM-facing control. When a player has a choice, they select it on their device; each change is saved as a draft and shown to the GM immediately. Players do not submit or resolve actions. Before confirmation, the GM's choice control is prefilled from the relevant player selection (or the selected outcome for a vote). The GM may change the choice, then must confirm every step before its effects are applied. For group choices, the GM sees each player's current selection and may edit a player's selection before confirming the step. Do not resolve an unclear step automatically. The GM adjudicates rule violations such as interruptions or silencing and records the consequence by selecting the player in the UI.

### Before the first night

1. Ask who wants to run for mayor. Each player selects yes or no on their device; the GM sees the current selections.
2. Give each candidate time to make a speech.
3. Hold the mayoral election. Each player selects a candidate on their device; show the current votes to the GM and prefill the GM's choice with the leading candidate when there is a unique leader. The GM may choose a different candidate and confirms the election **[UI]**.
4. The mayor names the town.

### Night

1. **First night only — Cupido:** Cupido selects two players to become lovers on their device. Show the current choice to the GM for confirmation **[UI]**. Then wake the lovers, show each of them their partner on their device, and explain that when one dies the other dies too.
2. **First night only — Wolfchild:** The Wolfchild selects a player to imitate on their device. Show the current choice to the GM for confirmation **[UI]** and explain the Wolfchild's alignment rule. In a physical game, tap the imitated player on the shoulder; they must keep their eyes closed.
3. **Old Knight:** The Old Knight chooses a player to protect **[UI]**.
4. **Guard:** The Guard chooses a player to check **[UI]**. Show the Guard the result on their device.
5. **Seer:** The Seer chooses a player to view **[UI]**. Show the role, or a thumbs-down result for the roles specified above, privately on the Seer's device.
6. **Sniffer:** The Sniffer chooses a player to check **[UI]**. Show the result privately. On the first night, if the target is a Werewolf, show thumbs-down and allow the Sniffer to reconsider any number of times.
7. **Werewolves:** Each Werewolf selects a target on their device; show the current selections to the GM immediately **[UI]**. The GM confirms the attack only when the Werewolves agree unanimously. If they cannot agree, the GM may select a final target or skip the attack. If the Wise Wolf is alive, show thumbs-down when they target the Old Knight, a player protected by the Old Knight, the Hunter, or the Elder. This is only a warning; the Werewolves may change their draft any number of times or unanimously keep the warned target. If the Throatcutter is alive and uses their ability, they select a silence target on their device; the GM confirms it **[UI]**. The target is silenced the next day but may still vote.
8. **Alchemist:** If the Alchemist still has a potion or poison, they select whether to use either or both and choose any targets on their device. Show the current choice to the GM; the GM confirms before resources are spent. The potion may save the Werewolves' target or, if the Old Knight's protection was triggered, save the Old Knight instead. If the potion saves the Old Knight, the Old Knight survives, but the first living Werewolf to the left of the protected player still dies. If used, the poison targets a player to kill **[UI]**.
9. **Little Girl:** The Little Girl selects a player on their device. Show the current choice to the GM for confirmation **[UI]**. Show the GM whether that player visited anyone during the night.

The GM confirms each action and advances the night when its steps are complete. A player's selection remains a draft until the GM confirms the step; changing a selection replaces that player's current draft. Determine the result of the Werewolf attack and Old Knight effect, including any deaths that would result. The Alchemist then selects whether to use the potion on the Werewolves' target or the Old Knight, and whether to use the poison; the GM confirms that choice. A potion used on the Old Knight prevents the Old Knight's pending death, but does not prevent the first living Werewolf to the left of the protected player from dying. Reveal night deaths in the morning; if multiple deaths are to be revealed, reveal them in random order. A Hunter killed at night may shoot when their death is revealed. A Hunter killed by lynching or by the Big Bad Wolf may shoot when killed. Resolve any resulting deaths from lovers or Hunter shots, including further Hunter shots when their trigger conditions are met, before checking for a game-ending condition.

### Day

1. Reveal deaths in the UI and resolve death-triggered abilities, including the Hunter and lovers.
2. Check for the end of the game and show the GM the outcome or why play continues **[UI]**. Ignore the Fool when checking faction wins. If no Villagers and no Werewolves remain, the game is a draw; otherwise, the Villagers win when no Werewolves remain, and the Werewolves win when no Villagers remain. The Wolfchild counts toward the faction matching their current alignment. A living Fool loses when either faction wins unless they are one of the living lovers; lovers win together under the lover win condition. If the lovers are the only two players alive, they win together. If both lovers are Werewolves, they may win with the Werewolves.
3. If the Bearman is alive, report whether their bear growls and why **[UI]**.
4. If daily Moon cards are enabled, the mayor selects one of three random available cards on their device **[UI]**. Show the current choice to the GM and remove the chosen card from the available cards only after the GM confirms.
5. Apply the chosen Moon card, if any:
   - **Ghost:** This card is not offered until at least one player has died. The ghost of the first player killed visits town and points at one player. The GM UI identifies the ghost. The meaning of the ghost's choice is for the players to interpret.
   - **Executioner:** Each living player selects one player to be executioner. The GM sees the current choices and confirms the result. The player with the most choices wins; the mayor selects among tied players, and the GM confirms that choice. The chosen executioner alone decides and carries out the lynching, and must lynch someone.
   - **Strict Sentence:** If the first lynched player is not a Werewolf, the villagers immediately hold a second lynch.
   - **Mistrust:** Each player privately selects their two closest friends. The GM sees the current choices; any player who receives no choices is lynched that evening after the GM confirms the step.
   - **In Need of Aid:** The mayor chooses a player to leave for the rest of the day and the following night. They cannot vote, use night powers, or be targeted.
   - **Buried:** From now on, the village is not told the identities of dead players.
   - **Good Manners:** Each player gets one uninterrupted turn to speak. The GM determines violations. A player who interrupts cannot vote; if that player must vote, the mayor controls their vote.
6. Let the players discuss. The GM advances when discussion is no longer productive or time is up. The Big Bad Wolf may reveal themselves and use their ability during the day, but before voting begins.
7. If the unanimous skip-lynching option is enabled, let all living players, including the mayor and silenced players, select whether to skip the lynch on their devices. Show their current selections to the GM. If all living players select skip, the GM confirms ending the day without a lynch; otherwise, the GM confirms proceeding to the lynch vote.
8. **Lynch vote:** Starting with the mayor, each voter selects a living player they trust to spare; that player then selects someone else to spare. Show each current choice to the GM and confirm it before continuing. A player cannot select themselves. Continue until one player is left; that player is lynched. If two players remain, the mayor is spared and the other player is lynched.
9. If the Judge is alive, they may select whether to reveal their role after the result is shown but before the lynched player is killed. The GM confirms the choice; if confirmed, the Judge becomes mayor and the lynch vote restarts from the beginning.
10. Kill the lynched player and reveal their identity unless Buried is active. If the player is one of the lovers, the other lover dies too. If the player is the Hunter, allow them to shoot another player.
11. Check for the end of the game again and show the outcome or why play continues **[UI]**.

If the mayor dies, the GM selects a new mayor from the living players and confirms the choice **[UI]**. For player choices throughout the game, selection changes are saved as drafts and shown to the GM; only GM confirmation applies the result.
