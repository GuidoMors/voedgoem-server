# werewolves server guide

Server game rules, state and validation notes. Consult the implementation and tests for current behavior; coordinate UI changes with the sibling frontend.

The Werewolves Village seats list is the seating order. In the pregame lobby, the GM moves players up or down directly in that list; each move saves immediately for everyone, without a separate ordering menu.

During an active Werewolves game, the lobby host can use **Exit game** in Host controls. After confirmation, everyone returns to the pregame lobby as spectators; the match and GM assignment are cleared, game settings are preserved, and no match result is recorded.

Werewolves GM recording controls show each player's options as a row of buttons beside their name, including individual Werewolf choices. Players use the same option buttons on their own devices. Their recorded selection is highlighted; unanswered questions have no selected option. Clicking another option changes it immediately. Multi-target and potion actions are recorded once all required selections are complete. The GM still confirms the step separately. Town names remain text inputs, and secret role icons in target buttons remain GM-only.

A live summary beside **Confirm step and continue** shows the recorded choices or step being confirmed, including the agreed Werewolf target, passes, votes, potion targets, and private results. Missing votes or pack disagreements are shown rather than implying an outcome is ready.

GM-recorded individual choices are reflected on the acting player's device, and player changes are reflected in the GM controls. These selections remain private to the actor and GM; town-name updates synchronize without recreating the text field.

The GM can browse previously confirmed steps with **Previous step**, **Next step**, and **Return to current step**. History is private to the GM and read-only: browsing never rewinds gameplay or edits earlier choices. Steps confirmed before history recording was introduced are not available.

After each Sniffer check, a separate result step privately shows the discovered role on the Sniffer's device and in the GM controls. The result must be marked **Seen it** before the GM can continue. First-night Werewolf checks still show thumbs-down, followed by another check after acknowledgement.

After each Seer check, a separate private result step shows the discovered role (or the existing thumbs-down result for roles hidden from the Seer). Seer and Sniffer result steps have synchronized **Seen it** / **Not yet** buttons that either the player or GM can change. Both steps require **Seen it** before continuing. Other players cannot see the result.

The Guard and Little Girl also receive separate private result steps with the same shared acknowledgement buttons, requiring **Seen it** before continuing. The Guard sees the dog's thumbs-up/down result. The Little Girl sees whether the checked player visited and their recorded destinations from this night, not earlier nights. Older games without recorded destinations explicitly show that the destination was not recorded.

During Werewolf target selection, participating living Werewolves see each other's secret role icons beneath their names in the village circle. This includes a converted Wolfchild, excludes absent players, and ends when the step changes; other players and spectators do not receive these roles.

Werewolves cannot select a Werewolf-aligned attack target, including themselves or a converted Wolfchild. A Wolfchild whose chosen player is still alive remains a valid Villager target and does not participate in pack selection.

The Throatcutter can silence only active Villager-aligned targets, including an unconverted Wolfchild, never Werewolves or neutrals. Eligible choices are shared privately with the Throatcutter and GM; player selections, GM choices, and final confirmation all enforce this restriction. Passing remains allowed.

After a Throatcutter uses their ability, a separate GM announcement step precedes dawn's night-death list. Confirming it publicly marks the victim's town card with a red dashed border and **Throat cut · Cannot speak** for that day. They may still vote; the marker disappears when the next night begins. Passing or an undrafted Throatcutter causes no reveal or marker.

Visible role badges below village avatars use team colors: grey for the Fool, yellow for Villagers, and red for Werewolves. The Wolfchild's badge is yellow while their chosen player lives and red after that player dies.

After the Wolfchild selects their imitation target, **feeling-watched** wakes that player alone and privately tells them they are being imitated, without identifying the Wolfchild. Shared **Seen it / Not yet** controls require acknowledgement before continuing. The target sees an orange border on their own card during this step. Afterwards, the Wolfchild and target see the border only with **Show secret role** enabled while the Wolfchild lives. The GM always sees the imitation border and lovers' pink borders, independent of player toggles. When both apply to one card, a pink border and orange outline show both relationships.

The GM's dawn death list includes each player's role icon. Deaths caused by Old Knight protection distinguish **Old Knight's Last Stand** (the Knight) from **Old Knight's Revenge** (the Werewolf); these causes carry through to death reveals and village events.

Night deaths are resolved at dawn in the daytime phase, before individual death reveals and the day's win-condition check.
Every night begins with the GM instruction to tell everyone to close their eyes and go to sleep. No player action is required; the GM continues when ready.

At dawn, the GM's upcoming-steps panel previews the remaining daytime flow even before those steps are queued. Once resolved, the actual queued daytime steps replace that forecast. Next-night steps remain a separate preview.

The Bearman's dawn report is skipped if the Bearman is dead or outside the role pool, including when they die during the morning reveals. Before confirmation, the GM sees whether the bear growls and why: either closest living neighbour in circular seating order must be Werewolf-aligned, with the Cloaked Wolf treated as a Villager.

The GM's dawn list previews only actual deaths using the same calculation as resolution. Unsuccessful Old Knight protection, potion saves, and an Elder surviving a Werewolf attack appear as small notes below the list, not as death entries.

Cupido's confirmed assignment immediately queues **lovers-meet**: the GM wakes both lovers to meet, then puts them back to sleep. Each lover privately sees their partner and pink borders on both town cards during that step, even with secret roles hidden. Afterwards the partner text and borders appear only with **Show secret role** enabled. Other players and display screens never see these private indicators; the GM's private view retains them.

Roles in the pool but not dealt to a player receive GM-only **Pretend** steps at their normal action moments (including first-night roles, Alchemist, Bearman, Big Bad Wolf, and Judge intervention). These steps have no choices, player UI, private results, or gameplay effects; the GM pauses and confirms to continue. Roles outside the pool and assigned roles that have died remain skipped. Conditional abilities such as the Hunter's death shot still require their actual trigger.

Revealed deaths include their cause in Village events and the death list for all viewers. Buried still hides the victim's role, not the cause of death.
Heartbreak causes also name the player's lover, including in the death list for previously recorded deaths.

When the lynch result already determines the last player's identity, the GM can only confirm it, not choose a different target.

The chain of votes to spare players continues until exactly one player remains unsaved. That player is the lynch target; having two unsaved players does not end voting or automatically spare the mayor.

Werewolf faction victories award wins to all Werewolf-aligned players, alive or dead, including converted Wolfchildren. Results and recorded match statistics use the same winner list.

A dead Wolfchild's alignment is frozen at death. They win with that faction, including a Villager victory if they died before converting; their imitation target dying later does not change it. Older death records use recorded death order to recover this alignment.

If the lynch target is the Fool, the GM confirms a separate public reveal step, followed by a step announcing the Fool's individual victory. The role stays visible to everyone, the Fool remains alive, and the normal post-lynch flow continues.

During the victory step, a Fool who is mayor must choose another active player as successor (the GM can also record the choice). After victory, the Fool is marked **Won · Out of play**: they are treated as dead for targeting, voting, living neighbours, Wolfchild imitation, and other game mechanics, without a death record or losing their individual victory.
