import os

path = 'src/routes/_authenticated/ngo.tsx'
with open(path, 'r') as f:
    content = f.read()

# Update state
old_state = '''  const [newInitiative, setNewInitiative] = useState({
    title: "",
    description: "",
    goal: "",
    short_term_goals: "",
    long_term_goals: "",
  });'''
new_state = '''  const [newInitiative, setNewInitiative] = useState({
    title: "",
    description: "",
    goal: "",
    short_term_goals: "",
    long_term_goals: "",
    target_milestones: "",
    expected_outcomes: "",
    impact_pool_target: "0",
  });'''

content = content.replace(old_state, new_state)

# Update mutation
old_mutation = '''      const { error } = await supabase.from("initiatives").insert({
        ngo_id: ngoProfile.id,
        title: newInitiative.title,
        description: newInitiative.description,
        goal_amount_mur: Number(newInitiative.goal),
        short_term_goals: newInitiative.short_term_goals,
        long_term_goals: newInitiative.long_term_goals,
        status: "active",
        is_approved: false,
      });'''

new_mutation = '''      const { error } = await supabase.from("initiatives").insert({
        ngo_id: ngoProfile.id,
        title: newInitiative.title,
        description: newInitiative.description,
        goal_amount_mur: Number(newInitiative.goal),
        short_term_goals: newInitiative.short_term_goals,
        long_term_goals: newInitiative.long_term_goals,
        target_milestones: newInitiative.target_milestones,
        expected_outcomes: newInitiative.expected_outcomes,
        impact_pool_target: Number(newInitiative.impact_pool_target),
        status: "active",
        is_approved: false,
      });'''

content = content.replace(old_mutation, new_mutation)

# Update reset
old_reset = '''      setNewInitiative({
        title: "",
        description: "",
        goal: "",
        short_term_goals: "",
        long_term_goals: "",
      });'''
new_reset = '''      setNewInitiative({
        title: "",
        description: "",
        goal: "",
        short_term_goals: "",
        long_term_goals: "",
        target_milestones: "",
        expected_outcomes: "",
        impact_pool_target: "0",
      });'''

content = content.replace(old_reset, new_reset)

# Add inputs to form
old_form_end = '''                    <textarea
                      placeholder="Long-term Goals"
                      value={newInitiative.long_term_goals}
                      onChange={(e) =>
                        setNewInitiative({ ...newInitiative, long_term_goals: e.target.value })
                      }
                      className="w-full rounded-xl border border-coral-500/20 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral-500/20 h-24"
                    />'''

new_form_end = '''                    <textarea
                      placeholder="Long-term Goals"
                      value={newInitiative.long_term_goals}
                      onChange={(e) =>
                        setNewInitiative({ ...newInitiative, long_term_goals: e.target.value })
                      }
                      className="w-full rounded-xl border border-coral-500/20 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral-500/20 h-24"
                    />
                    <textarea
                      placeholder="Target Milestones"
                      value={newInitiative.target_milestones}
                      onChange={(e) =>
                        setNewInitiative({ ...newInitiative, target_milestones: e.target.value })
                      }
                      className="w-full rounded-xl border border-coral-500/20 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral-500/20 h-24"
                    />
                    <textarea
                      placeholder="Expected Outcomes"
                      value={newInitiative.expected_outcomes}
                      onChange={(e) =>
                        setNewInitiative({ ...newInitiative, expected_outcomes: e.target.value })
                      }
                      className="w-full rounded-xl border border-coral-500/20 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral-500/20 h-24"
                    />
                    <div>
                      <label className="text-xs font-medium text-coral-500 uppercase">Impact Pool Target (MUR)</label>
                      <input
                        placeholder="Impact Pool Target"
                        type="number"
                        value={newInitiative.impact_pool_target}
                        onChange={(e) =>
                          setNewInitiative({ ...newInitiative, impact_pool_target: e.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-coral-500/20 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral-500/20"
                      />
                    </div>'''

content = content.replace(old_form_end, new_form_end)

with open(path, 'w') as f:
    f.write(content)
