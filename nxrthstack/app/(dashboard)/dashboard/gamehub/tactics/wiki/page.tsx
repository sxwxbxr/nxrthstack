import { ALL_CONDITIONS, ALL_ACTIONS } from "@/lib/gamehub/tactics/tacticsscript/grammar";
import { ALL_UNITS, UNIT_LIST } from "@/lib/gamehub/tactics/units";
import { CLASS_DESCRIPTIONS } from "@/lib/gamehub/tactics/types";
import { Icons } from "@/components/icons";

export const metadata = { title: "TacticsScript Wiki" };

const CLASS_ORDER = ["Tank", "Ranger", "Healer", "Assassin", "Mage", "Paladin", "Berserker"] as const;

export default function TacticsScriptWikiPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">TacticsScript Wiki</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete reference guide for the TacticsScript behavior language.
        </p>
      </div>

      {/* Table of Contents */}
      <nav className="rounded-lg border border-border bg-card p-4">
        <p className="font-semibold text-foreground mb-2">Contents</p>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li><a href="#syntax" className="hover:text-primary transition-colors">1. Syntax Reference</a></li>
          <li><a href="#conditions" className="hover:text-primary transition-colors">2. All Conditions</a></li>
          <li><a href="#actions" className="hover:text-primary transition-colors">3. All Actions</a></li>
          <li><a href="#and" className="hover:text-primary transition-colors">4. AND Compound Conditions</a></li>
          <li><a href="#abilities" className="hover:text-primary transition-colors">5. Unit Ability Reference</a></li>
          <li><a href="#strategies" className="hover:text-primary transition-colors">6. Strategy Examples</a></li>
          <li><a href="#tips" className="hover:text-primary transition-colors">7. Tips &amp; Best Practices</a></li>
        </ul>
      </nav>

      {/* 1. Syntax Reference */}
      <section id="syntax" className="space-y-4">
        <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">1. Syntax Reference</h2>

        <p className="text-sm text-muted-foreground">
          TacticsScript controls your unit&apos;s AI in battle. Each line is a rule that tells your unit
          what to do. Rules are checked from top to bottom — the <strong className="text-foreground">first rule that matches</strong> is executed.
        </p>

        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Basic Rule</p>
            <pre className="bg-background rounded border border-border p-3 text-sm text-green-400">
IF &lt;condition&gt; THEN &lt;action&gt;</pre>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-1">With Parameters</p>
            <pre className="bg-background rounded border border-border p-3 text-sm text-green-400 whitespace-pre-wrap">
{`IF self_low_hp(30) THEN move_to_cover
IF ability_ready("fireball") THEN use_ability("fireball")`}</pre>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Compound Conditions (AND)</p>
            <pre className="bg-background rounded border border-border p-3 text-sm text-green-400 whitespace-pre-wrap">
{`IF ability_ready("heal") AND ally_low_hp(40) THEN use_ability("heal")
IF self_low_hp(25) AND no_enemy_in_range THEN move_to_cover`}</pre>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Fallback Rule</p>
            <pre className="bg-background rounded border border-border p-3 text-sm text-green-400">
ELSE attack_nearest</pre>
            <p className="text-xs text-muted-foreground mt-1">
              Same as <code className="text-yellow-400">IF always THEN attack_nearest</code>. Always put this last.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Comments</p>
            <pre className="bg-background rounded border border-border p-3 text-sm text-gray-400">
// This is a comment — ignored by the engine</pre>
          </div>
        </div>
      </section>

      {/* 2. All Conditions */}
      <section id="conditions" className="space-y-4">
        <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">2. All Conditions</h2>
        <p className="text-sm text-muted-foreground">
          Conditions check the state of the battlefield. Some require a parameter in parentheses.
        </p>

        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-card">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-foreground">Condition</th>
                <th className="text-left px-4 py-2 font-medium text-foreground">Parameter</th>
                <th className="text-left px-4 py-2 font-medium text-foreground">Description</th>
              </tr>
            </thead>
            <tbody>
              {ALL_CONDITIONS.map((c) => (
                <tr key={c.name} className="border-t border-border">
                  <td className="px-4 py-2">
                    <code className="text-cyan-400 font-mono text-xs">
                      {c.name}{c.hasParam ? (c.paramType === "number" ? "(50)" : '("id")') : ""}
                    </code>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {c.hasParam ? (c.paramType === "number" ? "Number (1-99)" : "Ability ID (string)") : "None"}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{c.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. All Actions */}
      <section id="actions" className="space-y-4">
        <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">3. All Actions</h2>
        <p className="text-sm text-muted-foreground">
          Actions tell your unit what to do when the condition is true.
        </p>

        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-card">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-foreground">Action</th>
                <th className="text-left px-4 py-2 font-medium text-foreground">Parameter</th>
                <th className="text-left px-4 py-2 font-medium text-foreground">Description</th>
              </tr>
            </thead>
            <tbody>
              {ALL_ACTIONS.map((a) => (
                <tr key={a.name} className="border-t border-border">
                  <td className="px-4 py-2">
                    <code className="text-orange-400 font-mono text-xs">
                      {a.name}{a.hasParam ? '("id")' : ""}
                    </code>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {a.hasParam ? "Ability ID (string)" : "None"}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{a.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. AND Compound Conditions */}
      <section id="and" className="space-y-4">
        <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">4. AND Compound Conditions</h2>
        <p className="text-sm text-muted-foreground">
          You can combine multiple conditions with <code className="text-primary font-bold">AND</code>.
          All conditions must be true for the rule to trigger.
        </p>

        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Two Conditions</p>
            <pre className="bg-background rounded border border-border p-3 text-sm text-green-400">
IF ability_ready(&quot;heal&quot;) AND ally_low_hp(40) THEN use_ability(&quot;heal&quot;)</pre>
            <p className="text-xs text-muted-foreground mt-1">
              Only heals when the ability is off cooldown AND an ally is below 40% HP.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Three Conditions</p>
            <pre className="bg-background rounded border border-border p-3 text-sm text-green-400">
IF self_low_hp(30) AND ability_ready(&quot;rage&quot;) AND enemy_in_range THEN use_ability(&quot;rage&quot;)</pre>
            <p className="text-xs text-muted-foreground mt-1">
              Only rages when low HP, the ability is ready, and there&apos;s an enemy to fight.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Ability Check + Attack</p>
            <pre className="bg-background rounded border border-border p-3 text-sm text-green-400">
IF ability_ready(&quot;shield_wall&quot;) AND self_low_hp(50) THEN use_ability(&quot;shield_wall&quot;)</pre>
            <p className="text-xs text-muted-foreground mt-1">
              Only uses shield wall when both hurt AND the ability is available.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Unit Ability Reference */}
      <section id="abilities" className="space-y-4">
        <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">5. Unit Ability Reference</h2>
        <p className="text-sm text-muted-foreground">
          Every unit has abilities you can use with{" "}
          <code className="text-orange-400">use_ability(&quot;id&quot;)</code> and check with{" "}
          <code className="text-cyan-400">ability_ready(&quot;id&quot;)</code>.
        </p>

        {CLASS_ORDER.map((cls) => {
          const classUnits = UNIT_LIST.filter((u) => u.class === cls);
          if (classUnits.length === 0) return null;
          return (
            <div key={cls} className="rounded-lg border border-border overflow-hidden">
              <div className="bg-card px-4 py-2">
                <h3 className="text-sm font-bold text-foreground">
                  {cls} — {CLASS_DESCRIPTIONS[cls].tagline}
                </h3>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-t border-border bg-card/50">
                    <th className="text-left px-4 py-1.5 font-medium text-foreground">Unit</th>
                    <th className="text-left px-4 py-1.5 font-medium text-foreground">Ability ID</th>
                    <th className="text-left px-4 py-1.5 font-medium text-foreground">Name</th>
                    <th className="text-left px-4 py-1.5 font-medium text-foreground">Type</th>
                    <th className="text-left px-4 py-1.5 font-medium text-foreground">CD</th>
                    <th className="text-left px-4 py-1.5 font-medium text-foreground">Range</th>
                  </tr>
                </thead>
                <tbody>
                  {classUnits.flatMap((unit) =>
                    unit.abilities.map((ability, ai) => (
                      <tr key={`${unit.id}-${ability.id}`} className="border-t border-border">
                        {ai === 0 ? (
                          <td className="px-4 py-1.5 font-medium text-foreground" rowSpan={unit.abilities.length}>
                            {unit.name}
                          </td>
                        ) : null}
                        <td className="px-4 py-1.5">
                          <code className="text-yellow-400 font-mono">&quot;{ability.id}&quot;</code>
                        </td>
                        <td className="px-4 py-1.5 text-muted-foreground">{ability.name}</td>
                        <td className="px-4 py-1.5 text-muted-foreground">{ability.effectType}</td>
                        <td className="px-4 py-1.5 text-muted-foreground">{ability.cooldownTicks / 4}s</td>
                        <td className="px-4 py-1.5 text-muted-foreground">{ability.range}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          );
        })}
      </section>

      {/* 6. Strategy Examples */}
      <section id="strategies" className="space-y-4">
        <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">6. Strategy Examples</h2>

        <StrategyExample
          title="Aggressive Rush (Assassin / Berserker)"
          description="Prioritize abilities, then kill the weakest enemy."
          script={`// Use ability aggressively
IF ability_ready("backstab") THEN use_ability("backstab")

// Finish off low HP enemies
IF enemy_low_hp(25) THEN attack_lowest_hp

// Default: attack nearest
ELSE attack_nearest`}
        />

        <StrategyExample
          title="Defensive Turtle (Tank)"
          description="Hold position, use shield, only attack what's in range."
          script={`// Shield up when taking damage
IF ability_ready("shield_wall") AND self_low_hp(70) THEN use_ability("shield_wall")

// Taunt enemies away from allies
IF ability_ready("taunt") AND enemy_in_range THEN use_ability("taunt")

// Attack if something is close
IF enemy_in_range THEN attack_nearest

// Otherwise, hold ground
ELSE hold_position`}
        />

        <StrategyExample
          title="Support Healer"
          description="Keep allies alive, only attack as a last resort."
          script={`// Emergency heal
IF ally_low_hp(30) THEN heal_lowest_ally

// Group heal when multiple allies hurt
IF ability_ready("group_heal") AND ally_low_hp(60) THEN use_ability("group_heal")

// Maintain regen on injured allies
IF ability_ready("regeneration") AND ally_low_hp(70) THEN use_ability("regeneration")

// Attack if nothing to heal
IF enemy_in_range THEN attack_nearest

ELSE move_towards_enemy`}
        />

        <StrategyExample
          title="Kiting Mage"
          description="Cast spells from safety, retreat when enemies approach."
          script={`// Fireball groups from max range
IF ability_ready("fireball") AND enemy_in_range THEN use_ability("fireball")

// Arcane blast single targets
IF ability_ready("arcane_blast") AND enemy_in_range THEN use_ability("arcane_blast")

// Kite if enemy gets close
IF enemy_in_range THEN kite

// Move into range if too far
ELSE move_towards_enemy`}
        />

        <StrategyExample
          title="Paladin Hybrid"
          description="Heal when allies are hurt, tank and fight otherwise."
          script={`// Emergency divine light
IF ability_ready("divine_light") AND ally_low_hp(40) THEN use_ability("divine_light")

// Shield bash when enemy is close and we're hurt
IF ability_ready("shield_bash") AND self_low_hp(50) AND enemy_in_range THEN use_ability("shield_bash")

// Attack nearest enemy
IF enemy_in_range THEN attack_nearest

ELSE move_towards_enemy`}
        />
      </section>

      {/* 7. Tips */}
      <section id="tips" className="space-y-4">
        <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">7. Tips &amp; Best Practices</h2>
        <div className="rounded-lg border border-border bg-card p-4 space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <span className="text-primary font-bold shrink-0">1.</span>
            <p><strong className="text-foreground">Priority matters.</strong> Rules are checked top-to-bottom. Put your most important/defensive rules first.</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary font-bold shrink-0">2.</span>
            <p><strong className="text-foreground">Always use a fallback.</strong> End every script with <code className="text-yellow-400">ELSE attack_nearest</code> or another default action.</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary font-bold shrink-0">3.</span>
            <p><strong className="text-foreground">Use AND for precision.</strong> Instead of wasting abilities at full HP, combine <code className="text-cyan-400">ability_ready</code> with <code className="text-cyan-400">self_low_hp</code>.</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary font-bold shrink-0">4.</span>
            <p><strong className="text-foreground">Match abilities to roles.</strong> Don&apos;t put <code className="text-orange-400">kite</code> on a melee Tank, or <code className="text-orange-400">move_towards_enemy</code> on a fragile Mage.</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary font-bold shrink-0">5.</span>
            <p><strong className="text-foreground">HP thresholds tune aggression.</strong> <code className="text-cyan-400">self_low_hp(70)</code> triggers early (cautious). <code className="text-cyan-400">self_low_hp(20)</code> triggers only in emergencies.</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary font-bold shrink-0">6.</span>
            <p><strong className="text-foreground">Cover helps ranged units.</strong> Use <code className="text-orange-400">move_to_cover</code> for Rangers and Mages to reduce incoming ranged damage by 25%.</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary font-bold shrink-0">7.</span>
            <p><strong className="text-foreground">Target priority matters.</strong> <code className="text-orange-400">attack_lowest_hp</code> finishes kills. <code className="text-orange-400">attack_highest_attack</code> removes the biggest threat first.</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary font-bold shrink-0">8.</span>
            <p><strong className="text-foreground">Keep scripts readable.</strong> Use comments (<code className="text-gray-400">//</code>) to explain your strategy. Future you will thank present you.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function StrategyExample({
  title,
  description,
  script,
}: {
  title: string;
  description: string;
  script: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
      <pre className="bg-background rounded border border-border p-3 text-xs text-green-400 whitespace-pre-wrap overflow-x-auto">
        {script}
      </pre>
    </div>
  );
}
